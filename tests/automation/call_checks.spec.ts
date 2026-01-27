import { englishStrippedStr } from '../localization/englishStrippedStr';
import { Global, HomeScreen } from './locators';
import { test_Alice_1W_Bob_1W } from './setup/sessionTest';
import { createContact } from './utilities/create_contact';
import {
  clickOn,
  clickOnWithText,
  waitForTestIdWithText,
} from './utilities/utils';
import { makeVoiceCall } from './utilities/voice_call';

test_Alice_1W_Bob_1W(
  'Voice calls',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    // Unfocus current conversation on receiver's end
    await clickOn(bobWindow1, Global.backButton);
    await clickOn(bobWindow1, HomeScreen.plusButton);
    await clickOnWithText(bobWindow1, Global.contactItem, 'Note to Self');
    await makeVoiceCall(aliceWindow1, bobWindow1);
    // In the receivers window, the message is 'Call in progress'
    await waitForTestIdWithText(
      bobWindow1,
      'call-notification-answered-a-call',
      englishStrippedStr('callsInProgress').toString(),
    );
    // Control message should be '{callerName} called you'
    // await waitForTestIdWithText(
    //   bobWindow1,
    //   'call-notification-answered-a-call',
    //   englishStrippedStr('callsCalledYou')
    //     .withArgs({ name: caller.userName })
    //     .toString(),
    // );
    // In the callers window, the message is 'You called {reciverName}'
    await waitForTestIdWithText(
      aliceWindow1,
      'call-notification-started-call',
      englishStrippedStr('callsYouCalled')
        .withArgs({ name: bob.userName })
        .toString(),
    );
  },
);
