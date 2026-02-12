import chalk from 'chalk';
import { spawn } from 'child_process';

// ANSI escape sequences
const ESC = '\x1b';
const ALT_SCREEN_ON = `${ESC}[?1049h`;
const ALT_SCREEN_OFF = `${ESC}[?1049l`;
const MOUSE_ON = `${ESC}[?1000h${ESC}[?1006h`; // X10 + SGR extended mouse
const MOUSE_OFF = `${ESC}[?1000l${ESC}[?1006l`;
const CURSOR_HIDE = `${ESC}[?25l`;
const CURSOR_SHOW = `${ESC}[?25h`;
const MOVE_TO = (row: number, col: number) => `${ESC}[${row};${col}H`;
const CLEAR_LINE = `${ESC}[2K`;
const RESET = `${ESC}[0m`;

const MAX_OUTPUT_LINES = 5000;

type TestStatus =
  | 'failed'
  | 'interrupted'
  | 'passed'
  | 'pending'
  | 'retrying'
  | 'running'
  | 'skipped'
  | 'timedOut';

interface TuiTestEntry {
  duration: number | null;
  errors: Array<{ message?: string; snippet?: string; stack?: string }>;
  id: string;
  output: string[];
  retry: number;
  status: TestStatus;
  title: string;
}

interface TuiProgress {
  completed: number;
  estimatedMinsLeft: number;
  total: number;
}

type StopCallback = () => void;

// --- Helpers ---

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

function truncate(str: string, maxLen: number): string {
  const stripped = stripAnsi(str);
  if (stripped.length <= maxLen) return str;
  return stripped.slice(0, maxLen - 1) + '\u2026';
}

function padRight(str: string, len: number): string {
  const padding = Math.max(0, len - visibleLength(str));
  return str + ' '.repeat(padding);
}

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m${remainSecs.toString().padStart(2, '0')}s`;
}

function statusLabel(status: TestStatus): string {
  switch (status) {
    case 'passed':
      return chalk.green(' OK ');
    case 'failed':
      return chalk.red('FAIL');
    case 'timedOut':
      return chalk.red('TIME');
    case 'running':
      return chalk.yellow(' RUN');
    case 'retrying':
      return chalk.magenta('RTRY');
    case 'skipped':
      return chalk.blue('SKIP');
    case 'interrupted':
      return chalk.yellow(' INT');
    case 'pending':
      return chalk.dim(' -- ');
  }
}

function wrapLine(line: string, width: number): string[] {
  if (width <= 0) return [line];
  const stripped = stripAnsi(line);
  if (stripped.length <= width) return [line];
  // Simple character-level wrap on the raw visible text
  const result: string[] = [];
  for (let i = 0; i < stripped.length; i += width) {
    result.push(stripped.slice(i, i + width));
  }
  return result;
}

// --- Main class ---

export class TerminalTui {
  private tests: Map<string, TuiTestEntry> = new Map();
  private testOrder: string[] = [];
  private selectedIndex = 0;
  private outputScrollOffset = 0;
  private activePaneFocus: 'list' | 'output' = 'list';
  private progress: TuiProgress = {
    completed: 0,
    estimatedMinsLeft: 0,
    total: 0,
  };
  private isActive = false;
  private renderScheduled = false;
  private originalStdinRawMode: boolean | undefined;
  private keyHandler: ((data: Buffer) => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private exitHandler: (() => void) | null = null;
  private flashMessage: string | null = null;
  private flashTimeout: ReturnType<typeof setTimeout> | null = null;
  private onStopCallback: StopCallback | null = null;
  private lastListStart = 0; // saved from render() for mouse click mapping
  private lastLeftWidth = 30; // saved from render() for mouse click mapping
  private autoFollow = true;
  private lastUserInteractionTime = 0;

  start(): void {
    if (!process.stdout.isTTY) return;

    this.isActive = true;
    this.originalStdinRawMode = process.stdin.isRaw;

    process.stdout.write(ALT_SCREEN_ON + CURSOR_HIDE + MOUSE_ON);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.ref();

    this.keyHandler = (data: Buffer) => {
      this.handleKey(data);
    };
    process.stdin.on('data', this.keyHandler);

    this.resizeHandler = () => {
      this.scheduleRender();
    };
    process.stdout.on('resize', this.resizeHandler);

    this.exitHandler = () => {
      this.restoreTerminal();
    };
    process.on('exit', this.exitHandler);

    this.scheduleRender();
  }

  stop(): void {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.flashTimeout) {
      clearTimeout(this.flashTimeout);
      this.flashTimeout = null;
    }

    this.removeListeners();
    this.restoreTerminal();
  }

  onStop(cb: StopCallback): void {
    this.onStopCallback = cb;
  }

  addTest(id: string, title: string): void {
    this.tests.set(id, {
      duration: null,
      errors: [],
      id,
      output: [],
      retry: 0,
      status: 'pending',
      title,
    });
    this.testOrder.push(id);
    this.scheduleRender();
  }

  updateTest(
    id: string,
    status: TestStatus,
    duration?: number,
    retry?: number,
  ): void {
    const entry = this.tests.get(id);
    if (!entry) return;
    entry.status = status;
    if (duration !== undefined) entry.duration = duration;
    if (retry !== undefined) entry.retry = retry;

    // Auto-follow: scroll to the test that just started running
    if (
      this.autoFollow &&
      (status === 'running' || status === 'retrying') &&
      Date.now() - this.lastUserInteractionTime > 30_000
    ) {
      const idx = this.testOrder.indexOf(id);
      if (idx >= 0) {
        this.selectedIndex = idx;
        this.outputScrollOffset = 0;
      }
    }

    this.scheduleRender();
  }

  appendOutput(id: string, text: string): void {
    const entry = this.tests.get(id);
    if (!entry) return;

    const lines = text.split(/\r?\n/);
    if (lines.length > 0 && entry.output.length > 0 && !text.startsWith('\n')) {
      entry.output[entry.output.length - 1] += lines.shift()!;
    }
    entry.output.push(...lines);

    // Cap output buffer
    if (entry.output.length > MAX_OUTPUT_LINES) {
      entry.output = entry.output.slice(-MAX_OUTPUT_LINES);
    }

    if (this.testOrder[this.selectedIndex] === id) {
      this.scheduleRender();
    }
  }

  clearOutput(id: string): void {
    const entry = this.tests.get(id);
    if (!entry) return;
    entry.output = [];
    entry.errors = [];
    if (this.testOrder[this.selectedIndex] === id) {
      this.outputScrollOffset = 0;
      this.scheduleRender();
    }
  }

  setError(
    id: string,
    errors: Array<{ message?: string; snippet?: string; stack?: string }>,
  ): void {
    const entry = this.tests.get(id);
    if (!entry) return;
    entry.errors = errors;
    this.scheduleRender();
  }

  setProgress(
    completed: number,
    total: number,
    estimatedMinsLeft: number,
  ): void {
    this.progress = { completed, estimatedMinsLeft, total };
    this.scheduleRender();
  }

  // --- Private ---

  private scheduleRender(): void {
    if (!this.isActive || this.renderScheduled) return;
    this.renderScheduled = true;
    process.nextTick(() => {
      this.renderScheduled = false;
      if (this.isActive) this.render();
    });
  }

  private render(): void {
    const cols = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;

    if (cols < 60 || rows < 10) {
      const msg = 'Terminal too small (min 60x10)';
      const r = Math.floor(rows / 2);
      const c = Math.max(1, Math.floor((cols - msg.length) / 2));
      process.stdout.write(
        MOVE_TO(1, 1) + ESC + '[2J' + MOVE_TO(r, c) + chalk.yellow(msg),
      );
      return;
    }

    const leftWidth = Math.min(Math.max(30, Math.floor(cols * 0.4)), cols - 22);
    const rightWidth = cols - leftWidth - 3; // 3 = left border + divider + right border
    const contentHeight = rows - 3; // header + bottom divider + status bar

    let buf = MOVE_TO(1, 1);

    // --- Header ---
    const leftHeader = ` Tests (${this.progress.completed}/${this.progress.total}) `;
    const selectedTest = this.tests.get(
      this.testOrder[this.selectedIndex] ?? '',
    );
    const rightHeaderLabel = selectedTest
      ? ` Output: ${truncate(selectedTest.title, rightWidth - 12)} `
      : ' Output ';

    const leftFill = Math.max(0, leftWidth - leftHeader.length - 1);
    const rightFill = Math.max(0, rightWidth - rightHeaderLabel.length - 1);

    buf += CLEAR_LINE;
    buf +=
      chalk.dim('\u250c') +
      chalk.dim('\u2500') +
      chalk.bold(leftHeader) +
      chalk.dim('\u2500'.repeat(leftFill));
    buf +=
      chalk.dim('\u252c') +
      chalk.dim('\u2500') +
      chalk.bold(rightHeaderLabel) +
      chalk.dim('\u2500'.repeat(rightFill));
    buf += chalk.dim('\u2510');

    // --- Content rows ---
    // Left pane: scrolling window around selectedIndex
    const listLen = this.testOrder.length;
    let listStart = 0;
    if (listLen > contentHeight) {
      listStart = Math.max(
        0,
        Math.min(
          this.selectedIndex - Math.floor(contentHeight / 2),
          listLen - contentHeight,
        ),
      );
    }
    this.lastListStart = listStart;
    this.lastLeftWidth = leftWidth;

    // Right pane: build wrapped output lines
    const outputLines = this.buildOutputLines(selectedTest, rightWidth - 2);
    const maxScroll = Math.max(0, outputLines.length - contentHeight);
    this.outputScrollOffset = Math.min(this.outputScrollOffset, maxScroll);

    for (let row = 0; row < contentHeight; row++) {
      const screenRow = row + 2;
      buf += MOVE_TO(screenRow, 1) + CLEAR_LINE;

      // Left cell
      const testIdx = listStart + row;
      let leftCell = '';
      if (testIdx < listLen) {
        const entry = this.tests.get(this.testOrder[testIdx])!;
        const isSelected = testIdx === this.selectedIndex;
        const label = statusLabel(entry.status);
        const retryStr =
          entry.retry > 0 ? chalk.dim(`r:${entry.retry}`) + ' ' : '';
        const durStr =
          entry.duration !== null
            ? chalk.dim(formatDuration(entry.duration))
            : chalk.dim('--');
        const maxTitleLen =
          leftWidth -
          4 -
          5 -
          (entry.retry > 0 ? 4 + String(entry.retry).length : 0) -
          5;
        const title = truncate(entry.title, Math.max(5, maxTitleLen));

        const line = ` ${label} ${retryStr}${title}`;
        const lineWithDur =
          padRight(line, leftWidth - visibleLength(durStr) - 2) + durStr + ' ';

        leftCell = isSelected
          ? this.activePaneFocus === 'list'
            ? chalk.inverse(padRight(lineWithDur, leftWidth))
            : chalk.bgGray(padRight(lineWithDur, leftWidth))
          : padRight(lineWithDur, leftWidth);
      } else {
        leftCell = ' '.repeat(leftWidth);
      }

      buf += chalk.dim('\u2502') + leftCell;

      // Divider
      buf += chalk.dim('\u2502');

      // Right cell
      const outIdx = this.outputScrollOffset + row;
      let rightCell = '';
      if (outIdx < outputLines.length) {
        rightCell = ' ' + truncate(outputLines[outIdx], rightWidth - 2) + RESET;
      }
      buf += padRight(rightCell, rightWidth);
    }

    // --- Bottom divider ---
    const bottomRow = contentHeight + 2;
    buf += MOVE_TO(bottomRow, 1) + CLEAR_LINE;
    buf += chalk.dim(
      '\u2514' +
        '\u2500'.repeat(leftWidth) +
        '\u2534' +
        '\u2500'.repeat(rightWidth) +
        '\u2518',
    );

    // --- Status bar ---
    const statusRow = bottomRow + 1;
    buf += MOVE_TO(statusRow, 1) + CLEAR_LINE;

    const listHint =
      this.activePaneFocus === 'list'
        ? chalk.bold('\u2191\u2193 navigate')
        : chalk.dim('\u2191\u2193 scroll');
    const tabHint = chalk.dim('Tab') + ' switch';
    const qHint = chalk.dim('q') + ' quit';
    const cHint = chalk.dim('c') + ' copy';
    const isFollowing =
      this.autoFollow && Date.now() - this.lastUserInteractionTime > 30_000;
    const fHint = isFollowing
      ? chalk.green('f') + chalk.green(' follow')
      : chalk.dim('f') + ' follow';
    const progressStr = chalk.dim(
      `${this.progress.completed}/${this.progress.total} done`,
    );
    const estStr =
      this.progress.estimatedMinsLeft > 0
        ? chalk.dim(`, ~${this.progress.estimatedMinsLeft}min left`)
        : '';
    const flash = this.flashMessage ? chalk.green(` ${this.flashMessage}`) : '';

    buf += ` ${listHint}  ${tabHint}  ${qHint}  ${cHint}  ${fHint}  ${chalk.dim(
      '|',
    )} ${progressStr}${estStr}${flash}`;

    process.stdout.write(buf);
  }

  private buildOutputLines(
    entry: TuiTestEntry | undefined,
    width: number,
  ): string[] {
    if (!entry) return [chalk.dim('  No test selected')];

    const lines: string[] = [];

    if (entry.output.length === 0 && entry.errors.length === 0) {
      if (entry.status === 'pending') {
        lines.push(chalk.dim('Waiting to start...'));
      } else if (entry.status === 'running' || entry.status === 'retrying') {
        lines.push(chalk.dim('Running... (no output yet)'));
      } else {
        lines.push(chalk.dim('No output'));
      }
      return lines;
    }

    // stdout/stderr output
    for (const line of entry.output) {
      lines.push(...wrapLine(line, width));
    }

    // errors
    if (entry.errors.length > 0) {
      lines.push('');
      lines.push(chalk.red.bold('\u2500\u2500 Errors \u2500\u2500'));
      for (const err of entry.errors) {
        if (err.message) {
          for (const msgLine of err.message.split('\n')) {
            lines.push(...wrapLine(chalk.red(msgLine), width));
          }
        }
        if (err.snippet) {
          lines.push('');
          for (const snipLine of err.snippet.split('\n')) {
            lines.push(...wrapLine(snipLine, width));
          }
        }
        if (err.stack) {
          lines.push('');
          for (const stackLine of err.stack.split('\n').slice(0, 10)) {
            lines.push(...wrapLine(chalk.dim(stackLine), width));
          }
        }
        lines.push('');
      }
    }

    return lines;
  }

  private handleKey(data: Buffer): void {
    const key = data.toString('utf-8');

    // Ctrl+C or q to quit
    if (data[0] === 0x03 || key === 'q' || key === 'Q') {
      this.stop();
      this.onStopCallback?.();
      return;
    }

    // SGR mouse: ESC [ < Cb ; Cx ; Cy M (press) or m (release)
    const sgrMatch = key.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/);
    if (sgrMatch) {
      const button = parseInt(sgrMatch[1], 10);
      const col = parseInt(sgrMatch[2], 10);
      const row = parseInt(sgrMatch[3], 10);
      const isPress = sgrMatch[4] === 'M';

      // Only handle left-click press (button 0)
      if (button === 0 && isPress) {
        // Content rows start at screen row 2, left pane is cols 1..leftWidth+1
        if (row >= 2 && col <= this.lastLeftWidth + 1) {
          const contentRow = row - 2;
          const testIdx = this.lastListStart + contentRow;
          if (testIdx >= 0 && testIdx < this.testOrder.length) {
            this.selectedIndex = testIdx;
            this.outputScrollOffset = 0;
            this.activePaneFocus = 'list';
            this.lastUserInteractionTime = Date.now();
            this.scheduleRender();
          }
        }
      }
      return;
    }

    // Tab to switch panes
    if (key === '\t') {
      this.activePaneFocus =
        this.activePaneFocus === 'list' ? 'output' : 'list';
      this.scheduleRender();
      return;
    }

    // c to copy
    if (key === 'c' || key === 'C') {
      this.copySelectedOutput();
      return;
    }

    // f to toggle auto-follow
    if (key === 'f' || key === 'F') {
      this.autoFollow = !this.autoFollow;
      if (this.autoFollow) {
        this.lastUserInteractionTime = 0;
      }
      this.showFlash(this.autoFollow ? 'Auto-follow ON' : 'Auto-follow OFF');
      return;
    }

    // Escape sequences (arrows, page up/down, home/end)
    if (data[0] === 0x1b && data[1] === 0x5b) {
      const rows = process.stdout.rows || 24;
      const contentHeight = rows - 3;

      switch (data[2]) {
        // Up arrow
        case 0x41:
          if (this.activePaneFocus === 'list') {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.outputScrollOffset = 0;
            this.lastUserInteractionTime = Date.now();
          } else {
            this.outputScrollOffset = Math.max(0, this.outputScrollOffset - 1);
          }
          this.scheduleRender();
          return;

        // Down arrow
        case 0x42:
          if (this.activePaneFocus === 'list') {
            this.selectedIndex = Math.min(
              this.testOrder.length - 1,
              this.selectedIndex + 1,
            );
            this.outputScrollOffset = 0;
            this.lastUserInteractionTime = Date.now();
          } else {
            this.outputScrollOffset += 1; // clamped in render
          }
          this.scheduleRender();
          return;

        // Home (ESC [ H)
        case 0x48:
          if (this.activePaneFocus === 'list') {
            this.selectedIndex = 0;
            this.outputScrollOffset = 0;
            this.lastUserInteractionTime = Date.now();
          } else {
            this.outputScrollOffset = 0;
          }
          this.scheduleRender();
          return;

        // End (ESC [ F)
        case 0x46:
          if (this.activePaneFocus === 'list') {
            this.selectedIndex = Math.max(0, this.testOrder.length - 1);
            this.outputScrollOffset = 0;
            this.lastUserInteractionTime = Date.now();
          } else {
            this.outputScrollOffset = Number.MAX_SAFE_INTEGER; // clamped in render
          }
          this.scheduleRender();
          return;
      }

      // Page Up (ESC [ 5 ~) / Page Down (ESC [ 6 ~)
      if (data[2] === 0x35 && data[3] === 0x7e) {
        // Page Up
        if (this.activePaneFocus === 'list') {
          this.selectedIndex = Math.max(0, this.selectedIndex - contentHeight);
          this.outputScrollOffset = 0;
          this.lastUserInteractionTime = Date.now();
        } else {
          this.outputScrollOffset = Math.max(
            0,
            this.outputScrollOffset - contentHeight,
          );
        }
        this.scheduleRender();
        return;
      }
      if (data[2] === 0x36 && data[3] === 0x7e) {
        // Page Down
        if (this.activePaneFocus === 'list') {
          this.selectedIndex = Math.min(
            this.testOrder.length - 1,
            this.selectedIndex + contentHeight,
          );
          this.outputScrollOffset = 0;
          this.lastUserInteractionTime = Date.now();
        } else {
          this.outputScrollOffset += contentHeight; // clamped in render
        }
        this.scheduleRender();
        return;
      }
    }
  }

  private copySelectedOutput(): void {
    const entry = this.tests.get(this.testOrder[this.selectedIndex] ?? '');
    if (!entry) return;

    let text = `Test: ${entry.title}\nStatus: ${entry.status}`;
    if (entry.duration !== null) {
      text += ` (${formatDuration(entry.duration)})`;
    }
    if (entry.retry > 0) {
      text += ` retry #${entry.retry}`;
    }
    text += '\n\n';

    if (entry.output.length > 0) {
      text += entry.output.map(stripAnsi).join('\n') + '\n';
    }

    for (const err of entry.errors) {
      text += '\n--- Error ---\n';
      if (err.message) text += err.message + '\n';
      if (err.snippet) text += err.snippet + '\n';
      if (err.stack) text += err.stack + '\n';
    }

    // Build ordered list of clipboard commands to try
    const candidates: Array<{ cmd: string; args: string[] }> = [];
    if (process.platform === 'darwin') {
      candidates.push({ cmd: 'pbcopy', args: [] });
    } else if (process.platform === 'win32') {
      candidates.push({ cmd: 'clip', args: [] });
    } else {
      if (process.env.WAYLAND_DISPLAY) {
        candidates.push({ cmd: 'wl-copy', args: [] });
      }
      candidates.push({ cmd: 'xclip', args: ['-selection', 'clipboard'] });
      candidates.push({ cmd: 'xsel', args: ['--clipboard', '--input'] });
    }

    this.tryCopyWithCandidates(text, candidates, 0);
  }

  private tryCopyWithCandidates(
    text: string,
    candidates: Array<{ cmd: string; args: string[] }>,
    index: number,
  ): void {
    if (index >= candidates.length) {
      // All clipboard tools failed — try OSC 52 escape sequence as last resort
      this.copyViaOsc52(text);
      return;
    }

    const { cmd, args } = candidates[index];
    try {
      const proc = spawn(cmd, args, { stdio: ['pipe', 'ignore', 'ignore'] });
      proc.stdin.write(text);
      proc.stdin.end();
      proc.on('error', () => {
        this.tryCopyWithCandidates(text, candidates, index + 1);
      });
      proc.on('close', (code) => {
        if (code === 0) {
          this.showFlash('Copied!');
        } else {
          this.tryCopyWithCandidates(text, candidates, index + 1);
        }
      });
    } catch {
      this.tryCopyWithCandidates(text, candidates, index + 1);
    }
  }

  private copyViaOsc52(text: string): void {
    try {
      const encoded = Buffer.from(text).toString('base64');
      process.stdout.write(`\x1b]52;c;${encoded}\x07`);
      this.showFlash('Copied (OSC 52)');
    } catch {
      this.showFlash('Copy failed');
    }
  }

  private showFlash(msg: string): void {
    this.flashMessage = msg;
    this.scheduleRender();
    if (this.flashTimeout) clearTimeout(this.flashTimeout);
    this.flashTimeout = setTimeout(() => {
      this.flashMessage = null;
      this.flashTimeout = null;
      this.scheduleRender();
    }, 1500);
  }

  private removeListeners(): void {
    if (this.keyHandler) {
      process.stdin.removeListener('data', this.keyHandler);
      this.keyHandler = null;
    }
    if (this.resizeHandler) {
      process.stdout.removeListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.exitHandler) {
      process.removeListener('exit', this.exitHandler);
      this.exitHandler = null;
    }
  }

  private restoreTerminal(): void {
    try {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(this.originalStdinRawMode ?? false);
      }
      process.stdin.pause();
      process.stdin.unref();
      process.stdout.write(MOUSE_OFF + ALT_SCREEN_OFF + CURSOR_SHOW);
    } catch {
      // Terminal may already be gone
    }
  }
}
