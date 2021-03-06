import { observable, action, computed } from 'mobx'
import nativeCalendar from 'src/utils/nativeCalendar'
import moment from 'moment'
import { setStorage, getStorage, generateRandomId } from 'src/utils'

// let timeoutId = ''

const themeColorKey = '@global_theme_color_set'

const futureListKey = '@future_list_key'

// IOS下的日期格式处理
const convertDateIOS = target => moment.utc(target).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
class Store {

  constructor() {
    this.initialFutureList()
  }
  // 顶层路由获取
  @observable nav = null
  @action setNav = value => this.nav = value
  // 当前点击的日期
  @observable targetDate = new Date()
  @action updateTargetDate = value => {
    if (value) {
      this.targetDate = new Date(value)
    } else {
      this.targetDate = null
    }
  }
  // 当前的路由栈
  @observable bottomNavName = 'Main'
  @action updateBottomNavName = value => this.bottomNavName = value
  @observable navStack = []
  @action storeNavPush = item => {
    this.navStack = this.navStack.concat([ item ])
  }
  @computed get navStackName() {
    if (!this.navStack.length) {
      return ''
    } else {
      return this.navStack[this.navStack.length - 1]
    }
  }
  @action storeNavPop = () => {
    this.navStack = this.navStack.slice(0, this.navStack.length - 1)
  }
  // 当前显示的待办列表数组
  @observable todoList = []
  @action updateTodoListById = (index, id, value) => {
    this.todoList[index][id] = value
  }
  // 初始化待办列表数组
  initialTodoList = () => {
    this.redirectCenterWeek(new Date())
  }
  // 一个缓存变量,存储startDay
  startDay = new Date()
  // 重定向到中心周，更新todoList[有闪动动画]
  @action redirectCenterWeek = async startday => {
    const startDay = new Date(startday)
    this.startDay = new Date(startday)
    const res = []
    // 获取这个日期范围内的事件
    await nativeCalendar.getWeekEvents(startDay, new Date(startDay).setDate(startDay.getDate() + 7))
    for(let i = 0;i < 7;i++) {
      const key = moment(startDay).format('YYYY-MM-DD')
      res.push({
        date: new Date(startDay),
        data: nativeCalendar.eventStorage[key] || {}
      })
      startDay.setDate(startDay.getDate() + 1)
    }
    this.todoList = res
  }
  // 更新todoList不出现闪动动画
  @action refreshTodoList = async startday => {
    const startDay = new Date(startday)
    this.startDay = new Date(startday)
    const res = []
    // 获取这个日期范围内的事件
    await nativeCalendar.getWeekEvents(startDay, new Date(startDay).setDate(startDay.getDate() + 7))
    for(let i = 0;i < 7;i++) {
      const key = moment(startDay).format('YYYY-MM-DD')
      res.push({
        date: new Date(startDay),
        data: nativeCalendar.eventStorage[key] || {}
      })
      startDay.setDate(startDay.getDate() + 1)
    }
    this.todoList = res
  }
  // 初始化存储在本地的待办数据
  storageData = {}
  initialStorageData = async () => {
    this.initialTodoList()
  }
  // 监听是否处于add页面
  @observable isAddPage = false
  @action updateIsAddPage = value => this.isAddPage = value
  // 监听add页面中是否弹出了键盘
  @observable keyboardHeight = 0
  @action updateKeyboardHeight = value => this.keyboardHeight = value
  // 监听是否处于addDaily页面
  @observable isAddDaily = false
  @action updateIsAddDaily = value => this.isAddDaily = value

  // 控制add页表单数据
  @observable addFormData = {
    id: '',
    title: '',
    description: '',
    inFuture: false,
    start: null,
    end: null,
    allDay: false,
    RAB: false,
    RAE: false,
    groupId: '',
    repeat: ''
  }
  @action updateAddFormData = value => {
    this.addFormData = value
  }
  @action resetAddFormData = () => {
    this.addFormData = {
      id: '',
      title: '',
      description: '',
      start: null,
      end: null,
      inFuture: false,
      allDay: false,
      RAB: false,
      RAE: false,
      groupId: '',
      repeat: ''
    }
  }

  // 控制addDaily页面表单数据
  @observable dailyFormData = {
    id: '',
    title: '',
    description: ''
  }
  // 更新单项/多项数据
  @action updateDailyFormItem = value => {
    this.dailyFormData = Object.assign(this.dailyFormData, {
      ...value
    })
  }
  // 重置表单
  @action resetDailyFormData = () => {
    this.dailyFormData = {
      id: '',
      title: '',
      description: ''
    }
  }


  /**
   * 未来的[不定时]任务
   * 虽然叫list但是是map方便去重
   */
  @observable
  _futureList = {}
  @action
  updateFutureList = value => this._futureList = value
  // 用于输出的数组形式
  @computed get futureList() {
    const keys = Object.keys(this._futureList)
    if (keys.length === 0) {
      return []
    }
    const output = []
    for(let key of keys) {
      output.push(this._futureList[key])
    }
    return output
  }

  // 添加一个未来任务
  updateFutureListItem = event => new Promise(async (resolve) => {
    const selectedCalendar = nativeCalendar.groupStorage.find(item => item.id === event.groupId)
    const id = (event.id && event.id in this._futureList) ? event.id : generateRandomId()
    const formatedEvent = {
      alarms: [],
      allDay: false,
      attendees: [],
      availability: 'notSupported',
      calendar: selectedCalendar || null,
      endDate: '',
      id, // 生成一个随机ID
      isDetached: false,
      location: '',
      notes: '',
      occurrenceDate: '',
      recurrence: '',
      recurrenceRule: {
        endDate: '',
        frequency: '',
        interval: '',
        occurrence: ''
      },
      startDate: convertDateIOS(new Date()),
      title: event.title,
      url: 'future',
      createdAt: new Date() // 创建时间
    }
    this.updateFutureList({
      ...this._futureList,
      [id]: formatedEvent
    })
    // 保存
    this.saveFutureList()
    resolve()
  })

  // 重新添加回一个任务
  recreateFutureListItem = item => new Promise((resolve) => {
    this.updateFutureList({
      ...this._futureList,
      [item.id]: item
    })
    // 保存
    this.saveFutureList()
    resolve()
  })

  // 删除一个未来任务
  removeFutureListItem = event => {
    if (event.id && event.id in this._futureList) {
      const temp = {
        ...this._futureList
      }
      delete temp[event.id]
      this.updateFutureList(temp)
      this.saveFutureList()
    }
  }

  // 保存列表
  saveFutureList = () => new Promise((resolve) => {
    setStorage(futureListKey, JSON.stringify(this._futureList)).then(resolve)
  })

  initialFutureList = async () => {
    const str = await getStorage(futureListKey)
    let tempList
    if (!str) {
      tempList = {}
    } else {
      tempList = JSON.parse(str)
    }
    delete tempList.id
    this.updateFutureList(tempList)
  }

  // 控制阻止其他操作
  preventOtherHandler = false

  // 当前处于操作状态的卡片id
  @observable focusCardId = ''
  @action updateFocusCardId = value => this.focusCardId = value

  // 发送全局通知的方法
  globalNotify = () => {}

  // 全局提示方法
  toast = () => {}

  // 控制底部导航栏显示
  setShowBottom = () => {}

  // 用于强制刷新某些组件的全局变量
  @observable
  lzk = false
  @action
  updateLzk = value => this.lzk = value
  // 强制刷新
  refreshWhatever = () => {
    this.updateLzk(!this.lzk)
  }

  // 更新themeContext方法
  setThemeColor = null

  // 更新主题色方法
  updateThemeColor = color => {
    this.setThemeColor(color)
    setStorage(themeColorKey, color)
  }
}

const store = new Store()

export default store
