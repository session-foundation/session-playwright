import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
} from '@playwright/test/reporter';

import chalk from 'chalk';
import { groupBy, isString, mean, sortBy } from 'lodash';

import { TerminalTui } from './terminalTui';

type TestAndResult = { test: TestCase; result: TestResult };

class TuiReporter implements Reporter {
  private tui = new TerminalTui();
  private allResults: Array<TestAndResult> = [];
  private allTests: TestCase[] = [];
  private allTestsCount = 0;
  private countWorkers = 1;
  private startTime = 0;

  printsToStdio(): boolean {
    return true;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.allTests = suite.allTests();
    this.allTestsCount = this.allTests.length;
    this.countWorkers = config.workers;
    this.startTime = Date.now();

    this.tui.start();
    this.tui.onStop(() => {
      // User pressed q or Ctrl+C during test run — print summary and terminate
      // (after onEnd, waitForClose() replaces this callback for graceful exit)
      this.printSummary();
      process.exit(1);
    });

    for (const test of this.allTests) {
      this.tui.addTest(test.id, test.title);
    }

    this.tui.setProgress(0, this.allTestsCount, 0);
  }

  onTestBegin(test: TestCase, result: TestResult) {
    const status = result.retry > 0 ? 'retrying' : 'running';
    if (result.retry > 0) {
      this.tui.clearOutput(test.id);
    }
    this.tui.updateTest(test.id, status, undefined, result.retry);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const status = result.status === 'timedOut' ? 'timedOut' : result.status;
    this.tui.updateTest(test.id, status, result.duration, result.retry);

    if (result.errors.length > 0) {
      this.tui.setError(
        test.id,
        result.errors.map((e) => ({
          message: e.message,
          snippet: e.snippet,
          stack: e.stack,
        })),
      );
    }

    this.allResults.push({ test, result });

    // Calculate progress
    const completedCount = this.allResults.length;
    const avgDuration = mean(this.allResults.map((m) => m.result.duration));
    const remainingTests = this.allTestsCount - completedCount;
    const estimatedMsLeft = (remainingTests * avgDuration) / this.countWorkers;
    const estimatedMinsLeft = Math.ceil(estimatedMsLeft / 60000);

    this.tui.setProgress(completedCount, this.allTestsCount, estimatedMinsLeft);
  }

  onStdOut(
    chunk: Buffer | string,
    test: TestCase | void,
    _result: TestResult | void,
  ) {
    if (test) {
      const text = isString(chunk) ? chunk : chunk.toString('utf-8');
      this.tui.appendOutput(test.id, text);
    }
  }

  onStdErr(
    chunk: Buffer | string,
    test: TestCase | void,
    _result: TestResult | void,
  ) {
    if (test) {
      const text = isString(chunk) ? chunk : chunk.toString('utf-8');
      this.tui.appendOutput(test.id, text);
    }
  }

  onError(error: TestError) {
    // Global errors: show in a pseudo-test entry
    const globalId = '__global_errors__';
    const existing = this.allResults.find((r) => r.test.id === globalId);
    if (!existing) {
      this.tui.addTest(globalId, '[Global Errors]');
    }
    const msg = error.message || 'Unknown error';
    this.tui.appendOutput(globalId, `${chalk.red('Error:')} ${msg}\n`);
    if (error.stack) {
      this.tui.appendOutput(globalId, chalk.dim(error.stack) + '\n');
    }
    this.tui.updateTest(globalId, 'failed');
  }

  async onEnd(_result: FullResult) {
    this.tui.reorderForSummary();
    // Workers are already cleaned up by the time onEnd is called.
    // Block here to keep the TUI open for browsing results.
    await this.tui.waitForClose();
    this.tui.stop();
    this.printSummary();
  }

  private printSummary() {
    const divider = chalk.dim('\u2550'.repeat(50));
    console.log(`\n${divider}`);
    console.log(chalk.bold('  Test Results'));
    console.log(divider);

    const grouped = groupBy(
      this.allResults.filter((r) => r.test.id !== '__global_errors__'),
      (a) => a.test.title,
    );

    let passedCount = 0;
    let failedCount = 0;
    let flakyCount = 0;
    let skippedCount = 0;
    let interruptedCount = 0;
    const failedTests: Array<{ results: TestAndResult[]; title: string }> = [];
    const flakyTests: Array<{ results: TestAndResult[]; title: string }> = [];

    for (const [title, results] of Object.entries(grouped)) {
      const allPassed = results.every((r) => r.result.status === 'passed');
      const anyPassed = results.some((r) => r.result.status === 'passed');
      const allSkipped = results.every((r) => r.result.status === 'skipped');
      const allInterrupted = results.every(
        (r) => r.result.status === 'interrupted',
      );

      if (allSkipped) {
        skippedCount++;
      } else if (allInterrupted) {
        interruptedCount++;
      } else if (allPassed) {
        passedCount++;
      } else if (anyPassed) {
        flakyCount++;
        flakyTests.push({ results, title });
      } else {
        failedCount++;
        failedTests.push({ results, title });
      }
    }

    // Tests that never finished (still running/pending when stopped)
    const finishedIds = new Set(this.allResults.map((r) => r.test.id));
    const cancelledTests = this.allTests.filter((t) => !finishedIds.has(t.id));
    const cancelledCount = cancelledTests.length;
    // Summary line
    const parts: string[] = [];
    if (passedCount > 0)
      parts.push(chalk.green(`\u2713 ${passedCount} passed`));
    if (failedCount > 0) parts.push(chalk.red(`\u2717 ${failedCount} failed`));
    if (flakyCount > 0) parts.push(chalk.yellow(`\u21bb ${flakyCount} flaky`));
    if (interruptedCount > 0)
      parts.push(chalk.yellow(`\u2716 ${interruptedCount} interrupted`));
    if (cancelledCount > 0)
      parts.push(chalk.dim(`\u25a0 ${cancelledCount} cancelled`));
    if (skippedCount > 0)
      parts.push(chalk.blue(`\u25cb ${skippedCount} skipped`));
    console.log(`  ${parts.join('  ')}`);
    console.log('');

    // Failed details
    if (failedTests.length > 0) {
      console.log(chalk.red.bold('  Failed:'));
      for (const { results, title } of sortBy(failedTests, (t) => t.title)) {
        const attempts = results.length;
        console.log(
          chalk.red(
            `    \u2717 ${title} (${attempts} attempt${
              attempts > 1 ? 's' : ''
            })`,
          ),
        );
      }
      console.log('');
    }

    // Flaky details
    if (flakyTests.length > 0) {
      console.log(chalk.yellow.bold('  Flaky (passed on retry):'));
      for (const { results, title } of sortBy(flakyTests, (t) => t.title)) {
        const passedResult = results.find((r) => r.result.status === 'passed');
        const retryNum = passedResult ? passedResult.result.retry + 1 : '?';
        console.log(
          chalk.yellow(
            `    \u21bb ${title} (passed on attempt ${retryNum}/${results.length})`,
          ),
        );
      }
      console.log('');
    }

    // Cancelled details
    if (cancelledTests.length > 0) {
      console.log(chalk.dim.bold('  Cancelled:'));
      for (const test of sortBy(cancelledTests, (t) => t.title)) {
        console.log(chalk.dim(`    \u25a0 ${test.title}`));
      }
      console.log('');
    }

    // Duration
    const totalMs = Date.now() - this.startTime;
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    console.log(chalk.dim(`  Duration: ${mins}m ${secs}s`));
    console.log(divider);
    console.log('');
  }
}

export default TuiReporter;
