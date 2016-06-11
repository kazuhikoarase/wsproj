
'use strict';
namespace wsproj.server {

  export function doLogin(data : any) {
    data.user = 'ユーザーA';
  }

  export function getProjectGroups() {
    return [
      {
        groupName : 'テストプロジェクトGrp1',
        projects : [
          {
            projectId : '_test', projectName : 'テストプロジェクト1',
            users: [
              {userId : 'user1', userName: 'ユーザーA'},
              {userId : 'user2', userName: 'ユーザーB'},
              {userId : 'user3', userName: 'ユーザーC'},
              {userId : 'user4', userName: 'ユーザーD'}
            ]
          },
          { 
            projectId : '_test2', projectName : 'テストプロジェクト2',
            users: [
              {userId : 'user1', userName: 'ユーザー1'},
              {userId : 'user2', userName: 'ユーザー2'},
              {userId : 'user3', userName: 'ユーザー3'},
              {userId : 'user4', userName: 'ユーザー4'}
            ]
          },
          {
            projectId : '_test3', projectName : 'テストプロジェクト3'
          }
        ]
      },
      {
        groupName : 'テストプロジェクトGrp2',
        projects : [
          {
            projectId : '_test', projectName : 'テストプロジェクト1',
            users: [
              {userId : 'user1', userName: 'ユーザーA'},
              {userId : 'user2', userName: 'ユーザーB'}
            ]
          },
          {
            projectId : '_test3', projectName : 'テストプロジェクト3'
          }
        ]
      }
    ];
  }
}