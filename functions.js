const { default: axios } = require('axios');

/**
 * build header message block
 * @returns {object}
 */
function buildHeaderBlock() {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `>[출시완료 일주일 이상 된 티켓 목록]`,
    },
  };
}

/**
 * build slack message
 */
function buildMessage({
  completeTicketsMap,
  errorTickets,
  jiraSlackUserMap,
  slackChannel,
  slackBotName,
  slackIconEmoji,
}) {
  const headerBlock = buildHeaderBlock();

  const dividerBlock = {
    type: 'divider',
  };

  const messageBlocks = [];
  for (const [user, tickets] of completeTicketsMap.entries()) {
    messageBlocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: jiraSlackUserMap[user]
          ? `\n\n<@${jiraSlackUserMap[user]}>`
          : `\n\n${user}`,
      },
    });

    messageBlocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: tickets
          .map((ticket) => `* https://bejewel.atlassian.net/browse/${ticket}`)
          .join('\n'),
      },
    });
  }

  if (
    errorTickets !== null &&
    errorTickets !== undefined &&
    errorTickets.length > 0
  ) {
    messageBlocks.push({
      type: 'divider',
    });

    messageBlocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `\n** 정보를 조회하지 못한 티켓 목록\n- ${errorTickets.join(
          ', ',
        )}`,
      },
    });
  }

  return {
    channel: slackChannel,
    username: slackBotName,
    icon_emoji: slackIconEmoji,
    blocks: [headerBlock, dividerBlock, ...messageBlocks],
  };
}

/**
 * jirausername:slackmemberid map string to object
 * @param {string} str
 * @returns {object}
 */
function userMapStringToObject(str) {
  const obj = {};

  if (!str) {
    return obj;
  }

  const users = str.split(',');
  users.forEach((user) => {
    const [jiraUserName, slackUserId] = user.split(':');
    obj[jiraUserName] = slackUserId;
  });

  return obj;
}

async function getCompleteTicketsOverOneWeek({
  jiraApiUrl,
  jiraUserEmail,
  jiraApiToken,
  tickets,
}) {
  // jira api 요청을 통해 티켓 정보를 전부 불러옴
  const result = await Promise.allSettled(
    tickets.map((ticket) =>
      axios
        .get(jiraApiUrl.replace('<ticket>', ticket), {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${jiraUserEmail}:${jiraApiToken}`,
            ).toString('base64')}`,
            Accept: 'application/json',
          },
        })
        .then((res) => res.data),
    ),
  );

  const ticketInfos = [];
  const errorTickets = [];

  result.forEach((res) => {
    if (res.status === 'fulfilled') {
      ticketInfos.push(res.value);
    } else {
      errorTickets.push(res.reason.config.url.match(/issue\/(.*)\?/)[1]);
    }
  });

  const completeTicketsMap = validateCompleteTicketsOverOneWeek(ticketInfos);

  return { completeTicketsMap, errorTickets };
}

function validateCompleteTicketsOverOneWeek(ticketInfos) {
  const now = new Date();
  const completeTicketsMap = new Map();

  // 티켓의 상태가 출시 완료 상태이고, 상태 변경일이 일주일 이상 지났을 경우 Map 에 추가 (reporter displayName 을 키로 사용)
  for (const ticketInfo of ticketInfos) {
    const statusCategoryChangeDate = new Date(
      ticketInfo.fields.statuscategorychangedate,
    );
    const diff = now.getTime() - statusCategoryChangeDate.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (ticketInfo.fields.status.name === '출시 완료' && diffDays >= 7) {
      if (completeTicketsMap.has(ticketInfo.fields.reporter.displayName)) {
        completeTicketsMap
          .get(ticketInfo.fields.reporter.displayName)
          .push(ticketInfo.key);
      } else {
        completeTicketsMap.set(ticketInfo.fields.reporter.displayName, [
          ticketInfo.key,
        ]);
      }
    }
  }

  return completeTicketsMap;
}

function isSkipNotification(completeTicketsMap, errorTickets) {
  for (const [user, tickets] of completeTicketsMap.entries()) {
    if (tickets.length > 0) {
      return false;
    }
  }

  return !(errorTickets !== null && errorTickets !== undefined && errorTickets.length > 0);
}

module.exports = {
  getCompleteTicketsOverOneWeek,
  buildMessage,
  userMapStringToObject,
  isSkipNotification,
};
