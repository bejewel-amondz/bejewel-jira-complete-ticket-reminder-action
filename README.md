# 출시완료 지라티켓 노티 액션

## 필요 정보
- webhook-url : 슬랙 웹훅 url
- jira-slack-map : JIRA ID : Slack ID 매핑정보 (ex: "spotlight21c:UBCDEFGHI,DavideViolante:UABCDEFGH")
- jira-api-url : ticket 정보를 조회하기 위해 url에 <ticket> 문자열 포함 (ex: 'https://bejewel.atlassian.net/rest/api/2/issue/<ticket>?fields=statuscategorychangedate,status,reporter')
- jira-user-email : 지라 api 사용할 유저 email
- jira-api-token : 지라 api 유저 토큰
- target-tickets : 조회할 티켓 목록 ','로 구분 (ex: "spotlight21c-123,spotlight21c-124")
- slack-channel : 보낼 슬랙 채널ID
- slack-bot-name : 슬랙 봇 이름
- slack-icon-emoji : 슬랙 봇 아이콘