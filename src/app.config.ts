export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/map/index',
    'pages/hazard/index',
    'pages/workorder/index',
    'pages/stats/index',
    'pages/facilities/index',
    'pages/offline/index',
    'pages/task-detail/index',
    'pages/hazard-detail/index',
    'pages/workorder-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E88E5',
    navigationBarTitleText: '供水管网巡检',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E88E5',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '今日任务'
      },
      {
        pagePath: 'pages/map/index',
        text: '地图巡检'
      },
      {
        pagePath: 'pages/hazard/index',
        text: '隐患上报'
      },
      {
        pagePath: 'pages/workorder/index',
        text: '工单处置'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计中心'
      }
    ]
  }
})
