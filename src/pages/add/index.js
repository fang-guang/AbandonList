import React, { useRef, useEffect, useState, Fragment, useCallback, useContext } from 'react';
import { View, StyleSheet, ScrollView,  TextInput, Dimensions, Alert, Linking, Text, Switch, TouchableOpacity, Animated, Keyboard, PixelRatio } from 'react-native';
import { Transitioning, Transition } from 'react-native-reanimated';
import moment from 'moment/min/moment-with-locales'
import nativeCalendar from 'src/utils/nativeCalendar'
import GroupModal from './groupModal'
import StartModal from './startModal'
import EndModal from './endModal'
import RepeatModal from './repeatModal'
import { useFocusEffect } from '@react-navigation/native';
import srcStore from 'src/store'
import themeContext from 'src/themeContext'
import Notification from 'src/utils/Notification'
import { setStorage, getStorage } from 'src/utils'

moment.locale('zh-cn');

const rememberGroupKey = '@remenber_group_key'

const firstAddKey = '@is_first_add_key'

// 将当前的时分赋值给一个Date
const withNowDate = date => {
  const temp = new Date(date)
  const now = new Date()
  now.setFullYear(temp.getFullYear())
  now.setMonth(temp.getMonth())
  now.setDate(temp.getDate())
  return now
}

const { width } = Dimensions.get('window')
function Add({ route }) {

  const theme = useContext(themeContext)

  // 路由活跃和不活跃时控制底部栏状态
  useFocusEffect(
    useCallback(() => {
      // Do something when the screen is focused
      srcStore.updateIsAddPage(true)
      return () => {
        // Do something when the screen is unfocused
        srcStore.updateIsAddPage(false)
        // 重置表单数据
        srcStore.resetAddFormData()
      }
    }, [])
  )
  // 键盘弹起/收回时控制底部栏位置
  const _keyboardShowHandler = e => {
    srcStore.updateKeyboardHeight(e.endCoordinates.height)
  }
  const _keyboardHideHandler = () => {
    srcStore.updateKeyboardHeight(0)
  }
  // 挂载时和卸载时监听/卸载keyboard事件
  let keyboardShowListener, keyboardHideListener
  useEffect(() => {
    // component did mount
    keyboardShowListener = Keyboard.addListener('keyboardWillShow', _keyboardShowHandler)
    keyboardHideListener = Keyboard.addListener('keyboardWillHide', _keyboardHideHandler)
    return () => {
      // component did unmount
      keyboardShowListener.remove()
      keyboardHideListener.remove()
    }
  }, [])

  // 获取路由参数
  let { date, info } = route.params || {}
  const textInputRef = useRef()

  // 更新表单数据方法
  const updateFormData = newMap => {
    srcStore.updateAddFormData({
      ...srcStore.addFormData,
      ...newMap
    })
  }



  const defaultStartTime = date ? withNowDate(date) : new Date()
  const defaultEndTime = new Date(defaultStartTime)
  defaultEndTime.setHours(defaultStartTime.getHours() + 1)

  // 是否已挂载
  const [ isMounted, setIsMounted ] = useState(false)
  // component did mount
  useEffect(() => {
    if (info) {
      // 上传ID,同时也是编辑页面的标识信息
      handleIdInit(info.id)
      // 编辑事件,根据传入信息修改表单
      handleTitleChange(info.title)
      handleDescriptionChange(info.notes)
      handleGroupIdChange(info.calendar.id)
      handleStartChange(new Date(info.startDate))
      handleEndChange(new Date(info.endDate))
      handleAllDayChange(info.allDay, false)
      handleInFutureChange(info.inFuture)
      handleRepeatChange(info.recurrence)
      Notification.getScheduleList().then(res => {
        const scheduleList = res.filter(item => item.userInfo.id === info.id)
        if (scheduleList.length === 2) {
          setRAE(true)
          setRAB(true)
          updateFormData({ RAE: true, RAB: true })
        } else if (scheduleList.length === 1) {
          setRAB(true)
          updateFormData({ RAB: true })
        }
      })
      // 判断分组是否可见
      judgeGroupVisible(info.calendar.id)
    } else {
      updateFormData({
        start: defaultStartTime,
        end: defaultEndTime,
        groupId: defaultGroupId
      })
      // 判断分组是否可见
      judgeGroupVisible(defaultGroupId)
    }
    setIsMounted(true)
  }, [])

  /**
   * 判断某个分组是否处于可见状态
   */
  // 可见分组
  const visibleGroupIds = nativeCalendar.visibleGroupIds
  const judgeGroupVisible = targetId => {
    // 判断分组是否可见
    if (!visibleGroupIds.includes(targetId)) {
      groupModalClose()
      srcStore.globalNotify({
        content: '当前所选择的分组处于不显示状态,请在【数据总览】->【设置】->【日历分组】中勾选目标分组，或直接新建一个分组'
      })
    }
  }
  // 初始化分组
  const groups = nativeCalendar.groupStorage
  // 默认分组
  const defaultGroup = groups.find(item => visibleGroupIds.includes(item.id)) || groups[0]
  const defaultGroupId = defaultGroup.id

  const [ showTip, setShowTip ] = useState(false)
  useEffect(() => {
    // 检查是否在本地存储过上次使用的分组，如果有就使用
    getStorage(rememberGroupKey).then(key => {
      if (key && groups.some(item => item.id === key)) {
        handleGroupIdChange(key)
      }
    })
    // 检查是否是第一次打开add页面
    getStorage(firstAddKey).then(key => {
      if (!key) {
        setShowTip(true)
        setStorage(firstAddKey, firstAddKey)
      }
    })
  }, [])

  /* =================== 表单数据管理 =================== */

  const [ title, setTitle ] = useState('')
  const [ description, setDescription ] = useState('')
  const [ allDay, setAllDay ] = useState(false)
  const [ inFuture, setInFuture ] = useState(false)
  const [ groupId, setGroupId ] = useState(defaultGroupId)
  const [ start, setStart ] = useState(defaultStartTime)
  const [ end, setEnd ] = useState(defaultEndTime)
  const [ repeat, setRepeat ] = useState('')

  // TODO: 在store中添加提醒管理
  const [ RAE, setRAE ] = useState(false)
  const [ RAB, setRAB ] = useState(false)
  const handleIdInit = value => {
    updateFormData({ id: value })
  }
  const handleTitleChange = value => {
    setTitle(value)
    updateFormData({ title: value })
  }

  const handleInFutureChange = (value = false) => {
    contentRef.current.animateNextTransition()
    setInFuture(value)
    updateFormData({ inFuture: value })
  }

  const handleDescriptionChange = value => {
    setDescription(value)
    updateFormData({ description: value })
  }
  const handleGroupIdChange = value => {
    setGroupId(value)
    updateFormData({ groupId: value })
    judgeGroupVisible(value)
  }
  const handleStartChange = value => {
    setStart(value)
    updateFormData({ start: value })
    const startTime = value.getTime()
    const endTime = end.getTime()
    // start始终小于end的事件一小时
    if (startTime > endTime) {
      const newEnd = new Date(startTime + 1000 * 60 * 60)
      setEnd(newEnd)
      updateFormData({ end: newEnd })
    }
  }
  const handleEndChange = value => {
    setEnd(value)
    updateFormData({ end: value })
    const startTime = start.getTime()
    const endTime = value.getTime()
    if (startTime > endTime) {
      const newStart = new Date(endTime - 1000 * 60 * 60)
      setStart(newStart)
      updateFormData({ start: newStart })
    }
  }
  const handleRepeatChange = value => {
    setRepeat(value)
    updateFormData({ repeat: value })
  }
  // 处理【选中/取消】全天
  const handleAllDayChange = (newValue, flag = true) => {
    contentRef.current.animateNextTransition()
    setAllDay(newValue)
    updateFormData({ allDay: newValue })
    if (flag) {
      if (newValue && RAB) {
        srcStore.toast('将会在当天早晨8:00提醒')
      }
    }
  }
  const handleRAEChange = newValue => {
    contentRef.current.animateNextTransition()
    setRAE(newValue)
    updateFormData({ RAE: newValue })
    if (newValue && RAB) {
      srcStore.toast('将会在事件开始和结束时设置提醒')
    } else if (newValue) {
      srcStore.toast('将会在事件结束时设置提醒')
    }
  }
  const handleRABChange = newValue => {
    Notification.withAuth(false).then(() => {
      contentRef.current.animateNextTransition()
      setRAB(newValue)
      updateFormData({ RAB: newValue })
      if (isMounted) {
        if (allDay && newValue) {
          srcStore.toast('将会在当天早晨8:00提醒')
        } else if (newValue && RAE ) {
          srcStore.toast('将会在事件开始和结束时设置提醒')
        } else if (newValue) {
          srcStore.toast('将会在事件开始时提醒')
        }
      }
    }).catch(() => {
      Alert.alert(
        '提示',
        '请开启通知权限',
        [
          {
            text: '确定',
            onPress: () => {

            }
          },{
            text: '去开启通知',
            onPress: () => {
              Linking.openURL('app-settings:')
            }
          }
        ]
      )
    })
  }


  /* =================== 控制下方弹窗 =================== */
  // 分组弹窗
  const [ groupModalVisible, setGroupModalVisible ] = useState(false)
  const groupModalOpen = () => setGroupModalVisible(true)
  const groupModalClose = () => setGroupModalVisible(false)
  // 开始时间弹窗
  const [ startModalVisible, setStartModalVisible ] = useState(false)
  const startModalOpen = () => setStartModalVisible(true)
  const startModalClose = () => setStartModalVisible(false)
  // 结束时间弹窗
  const [ endModalVisible, setEndModalVisible ] = useState(false)
  const endModalOpen = () => setEndModalVisible(true)
  const endModalClose = () => setEndModalVisible(false)
  // 重复弹窗
  const [ repeatModalVisible, setRepeatModalVisible ] = useState(false)
  const repeatModalOpen = () => setRepeatModalVisible(true)
  const repeatModalClose = () => setRepeatModalVisible(false)
  /* ================================================== */


  const repeatMap = [
    {
      label: 'Never',
      recurrence: '',
      value: {}
    },{
      label: 'Every Week',
      recurrence: 'weekly',
      value: {
        recurrence: 'weekly'
      }
    },{
      label: 'Every Month',
      recurrence: 'monthly',
      value: {
        recurrence: 'monthly'
      }
    },{
      label: 'Every Year',
      recurrence: 'yearly',
      value: {
        recurrence: 'yearly'
      }
    }
  ]
  const contentRef = useRef()
  const [ animateTitleScale ] = useState(new Animated.Value(0))
  // component did mount
  useEffect(() => {
    Animated.spring(animateTitleScale, {
      delay: 300,
      toValue: 1
    }).start(() => {
      // 卡片展开后键盘自动聚焦
      // textInputRef.current.focus()
    })
  }, [])
  const contentTransition = (
    <Transition.Sequence>
      <Transition.Out interpolation="easeInOut"
        type="fade"
      />
      <Transition.Change interpolation="easeInOut" />
      <Transition.In interpolation="easeInOut"
        type="fade"
      ></Transition.In>
    </Transition.Sequence>
  )
  const selectGroup = groups.find(item => item.id === groupId)
  return (
    <View style={ styles.container }>
      <Animated.View
        style={ [ styles.addCard, {
          transform: [ { scale: animateTitleScale } ]
        } ] }
      >
        <TextInput
          defaultValue={ title }
          keyboardAppearance="dark"
          onChangeText={ handleTitleChange }
          placeholder="请输入事件名"
          placeholderTextColor="#666"
          ref={ textInputRef }
          returnKeyType="done"
          style={ styles.textInput }
        />
      </Animated.View>
      <View style={ { flex: 1 } }>
        <ScrollView
          alwaysBounceVertical={ false }
          keyboardDismissMode="on-drag"
          showsHorizontalScrollIndicator={ false }
          showsVerticalScrollIndicator={ false }
          style={ { flex: 1 } }
        >
          <Transitioning.View
            ref={ contentRef }
            style={ styles.selectContainer }
            transition={ contentTransition }
          >
            <View style={ {
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 20,
              paddingBottom: 20,
              paddingLeft: 10,
              paddingRight: 10,
              fontSize: 16
            } }
            >
              <TextInput
                clearButtonMode="while-editing"
                defaultValue={ description }
                keyboardAppearance="dark"
                multiline
                onChangeText={ handleDescriptionChange }
                placeholder="备注"
                placeholderTextColor="#2F2F2F"
                returnKeyType="done"
                style={ {
                  flex: 1,
                  color: '#FFF'
                } }
              />
            </View>

            <View style={ styles.itemRow }>
              <Text style={ styles.itemLabel }>分组</Text>
              {
                !info ? (
                  <TouchableOpacity onPress={ groupModalOpen }>
                    <View style={ {
                      padding: 10,
                      borderColor: selectGroup.color,
                      borderWidth: 3,
                      borderRadius: 18,
                      minWidth: 60,
                      alignItems: 'center'
                    } }
                    >
                      <Text style={ {
                        fontSize: 16,
                        lineHeight: 16,
                        color: selectGroup.color,
                        fontWeight: '600'
                      } }
                      >{ selectGroup.title }</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={ {
                    opacity: 0.4,
                    padding: 10,
                    borderColor: selectGroup.color,
                    borderWidth: 3,
                    borderRadius: 18,
                    minWidth: 60,
                    alignItems: 'center'
                  } }
                  >
                    <Text style={ {
                      fontSize: 16,
                      lineHeight: 16,
                      color: selectGroup.color,
                      fontWeight: '600'
                    } }
                    >{ selectGroup.title }</Text>
                  </View>
                )
              }
            </View>
            <View style={ styles.itemRow }>
              <Text style={ styles.itemLabel }>
                以后
                {
                  showTip && (
                    <Text style={ [ styles.subItemLabel, { color: theme.subText } ] }>
                      &ensp;对于当前重要程度不高的事项
                    </Text>
                  )
                }
              </Text>
              <Switch
                onValueChange={ handleInFutureChange }
                trackColor={ { false: '', true: theme.themeColor } }
                value={ inFuture }
              />
            </View>
            {
              !inFuture && (
                <Fragment>
                  <View style={ styles.itemRow } >
                    <Text style={ styles.itemLabel }>提醒</Text>
                    <Switch
                      onValueChange={ handleRABChange }
                      trackColor={ { false: '', true: theme.themeColor } }
                      value={ RAB }
                    />
                  </View>
                  <View style={ styles.itemRow }>
                    <Text style={ styles.itemLabel }>时间</Text>
                    <TouchableOpacity onPress={ startModalOpen }>
                      <Text style={ styles.itemValue }>{ moment(start).format('lll') }</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={ styles.itemRow }>
                    <Text style={ styles.itemLabel }>重复</Text>
                    <TouchableOpacity onPress={ repeatModalOpen }>
                      <Text style={ styles.itemValue }>{ repeatMap.find(item => item.recurrence === repeat).label }</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={ styles.itemRow }>
                    <Text style={ styles.itemLabel }>全天</Text>
                    <Switch
                      onValueChange={ handleAllDayChange }
                      trackColor={ { false: '', true: theme.themeColor } }
                      value={ allDay }
                    />
                  </View>
                  <View style={ {
                    marginTop: 20,
                    marginBottom: 20,
                    height: 2 / PixelRatio.get(),
                    backgroundColor: '#2F2F2F'
                  } }
                  />
                </Fragment>
              )
            }

            { ((RAB && !allDay) || RAE) && !inFuture && (
              <Fragment>
                <View style={ styles.itemRow }>
                  <Text style={ styles.itemLabel }>结束时提醒</Text>
                  <Switch
                    onValueChange={ handleRAEChange }
                    trackColor={ { false: '', true: theme.themeColor } }
                    value={ RAE }
                  />
                </View>
                <View style={ styles.itemRow }>
                  <Text style={ styles.itemLabel }>结束时间</Text>
                  <TouchableOpacity onPress={ endModalOpen }>
                    <Text style={ styles.itemValue }>{ moment(end).format('lll') }</Text>
                  </TouchableOpacity>
                </View>
              </Fragment>
            ) }
          </Transitioning.View>
          <GroupModal
            groups={ groups }
            handleClose={ groupModalClose }
            selectGroupId={ groupId }
            setSelectGroupId={ handleGroupIdChange }
            visible={ groupModalVisible }
          />
          <StartModal
            handleClose={ startModalClose }
            setStartTime={ handleStartChange }
            startTime={ start }
            visible={ startModalVisible }
          />
          <EndModal
            endTime={ end }
            handleClose={ endModalClose }
            setEndTime={ handleEndChange }
            visible={ endModalVisible }
          />
          <RepeatModal
            handleClose={ repeatModalClose }
            repeat={ repeat }
            repeatMap={ repeatMap }
            setRepeat={ handleRepeatChange }
            visible={ repeatModalVisible }
          />
        </ScrollView>
      </View>
    </View>
  )
}

export default (Add)

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 60,
    backgroundColor: '#212121',
    flex: 1,
    flexDirection: 'column'
  },
  addCard: {
    height: 80,
    backgroundColor: '#2F2F2F',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 }
  },
  textInput: {
    height: 30,
    width: width - 80,
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center'
  },
  itemValue: {
    color: '#dbdbdb',
    fontSize: 16,
    lineHeight: 20,
    paddingTop: 20,
    paddingBottom: 20
    // fontWeight: '300'
  },
  itemLabel: {
    fontWeight: '500',
    color: '#FFF',
    fontSize: 16,
    lineHeight: 20,
    paddingTop: 20,
    paddingBottom: 20
  },
  subItemLabel: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 10
  },
  selectContainer: {
    paddingTop: 40,
    paddingBottom: 80
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10
  }
})