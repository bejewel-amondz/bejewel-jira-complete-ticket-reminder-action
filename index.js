require('dotenv').config();
const core = require('@actions/core');
const { IncomingWebhook } = require('@slack/webhook');

const {
  getCompleteTicketsOverOneWeek,
  buildMessage,
  userMapStringToObject,
} = require('./functions');

const { GITHUB_TOKEN } = process.env;

async function main() {
  try {
    const jiraSlackUserMapString = core.getInput('jira-slack-map', {
      required: true,
    });
    const webhookUrl = core.getInput('webhook-url', {
      required: true,
    });
    const jiraApiUrl = core.getInput('jira-api-url', {
      required: true,
    });
    const jiraUserEmail = core.getInput('jira-user-email', {
      required: true,
    });
    const jiraApiToken = core.getInput('jira-api-token', {
      required: true,
    });
    const targetTickets = core.getInput('target-tickets', {
      required: true,
    });
    const slackChannel = core.getInput('slack-channel', { required: true });
    const slackBotName = core.getInput('slack-bot-name', { required: true });
    const slackIconEmoji = core.getInput('slack-icon-emoji', {
      required: true,
    });

    const { completeTicketsMap, errorTickets } =
      await getCompleteTicketsOverOneWeek({
        jiraApiUrl,
        jiraUserEmail,
        jiraApiToken,
        tickets: targetTickets.split(','),
      });

    const jiraSlackUserMap = userMapStringToObject(jiraSlackUserMapString);

    const webhook = new IncomingWebhook(webhookUrl);

    const message = buildMessage({
      completeTicketsMap,
      errorTickets,
      jiraSlackUserMap,
      slackChannel,
      slackBotName,
      slackIconEmoji,
    });
    console.info(JSON.stringify(message));

    const sendResult = await webhook.send(message);
    console.info(sendResult);
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}

main();
