import React, { useState, useEffect, Fragment, useContext, useMemo } from 'react';
import { Modal, Text, Clipboard, TouchableWithoutFeedback, View, Dimensions, Animated, StyleSheet, Image } from 'react-native'
import { BlurView } from '@react-native-community/blur';
import { info_, setting, ring, correctGreen, wrongRed, shalou } from 'src/assets/image'
import moment from 'moment/min/moment-with-locales'
import srcStore from 'src/store'
import { TouchableOpacity } from 'react-native-gesture-handler';
import Notification from 'src/utils/Notification'
import ThemeContext from 'src/themeContext'
import { Toast } from 'src/components'

moment.locale('zh-cn');
const { width, height } = Dimensions.get('window')
const CardExpandModal = ({ setVisible, info, handleAbandon, handleFinish, handleSetting }) => {
  const handleClose = () => {
    setVisible(false)
    srcStore.preventOtherHandler = false
  }
  const [ AnimatedScale ] = useState(new Animated.Value(0.2))
  // component did mount
  useEffect(() => {
    Animated.spring(AnimatedScale, {
      toValue: 1
    }).start()
    return () => {
      srcStore.preventOtherHandler = false
    }
  }, [])
  const [ ringText, setRingText ] = useState('')
  Notification.getScheduleList().then(res => {
    const scheduleList = res.filter(item => item.userInfo.id === info.id)
    if (info.allDay && scheduleList.length) {
      setRingText('将会在当日早晨8:00AM提醒')
      return
    }
    if (scheduleList.length === 2) {
      setRingText('将会在事件开始和结束时时提醒')
    } else if (scheduleList.length === 1) {
      if (scheduleList[0].alertBody.endsWith('开始')) {
        setRingText('将会在事件开始时提醒')
      } else if (scheduleList[0].alertBody.endsWith('结束')) {
        setRingText('将会在事件结束时提醒')
      }
    } else {
      setRingText('暂无提醒')
    }
  })

  // 是否显示结束时间
  const showEndTime = useMemo(() => {
    return ringText === '将会在事件结束时提醒' || ringText === '将会在事件开始和结束时时提醒'
  }, [ ringText ])

  const theme = useContext(ThemeContext)

  // 复制备注内容
  const clipDesc = () => {
    if (info.notes) {
      Clipboard.setString(info.notes)
      toast('复制成功')
    }
  }

  const [ showToast, setShowToast ] = useState(false)
  const [ toastMsg, setToastMsg ] = useState('')

  const toast = msg => {
    setToastMsg(msg)
    setShowToast(true)
  }

  return (
    <Modal
      animationType="fade"
      transparent
      visible
    >
      <TouchableWithoutFeedback onPress={ handleClose }>
        <BlurView
          blurAmount={ 10 }
          blurType="extraDark"
          style={ {
            flex: 1
          } }
        />
      </TouchableWithoutFeedback>
      <Animated.View style={ [ styles.card, {
        backgroundColor: theme.subColor,
        transform: [ { scaleY: AnimatedScale } ]
      } ] }
      >
        <View>
          <Text style={ styles.cardName }>{ info.title }</Text>
          <View style={ {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
          } }
          >
            <View style={ [ styles.circle, {
              backgroundColor: info.calendar.color
            } ] }
            />
            <Text style={ {
              color: theme.subText,
              fontSize: 14,
              fontWeight: '500'
            } }
            >{ info.calendar.title }</Text>
          </View>
          <TouchableWithoutFeedback onPress={ clipDesc }>
            <View style={ styles.row }>
              <Image source={ info_ }
                style={ styles.icon }
              ></Image>
              <Text style={ styles.content }>{ info.notes ? info.notes : '暂无备注' }</Text>
            </View>
          </TouchableWithoutFeedback>

          {
            info.allDay ? (
              <View style={ styles.row }>
                <Image source={ shalou }
                  style={ [ styles.icon, { transform: [ { rotate: '180deg' } ] } ] }
                ></Image>
                <Text style={ styles.content }>{ moment(info.startDate).format('LL') + '全天' }</Text>
              </View>
            ) : (
              <Fragment>
                <View style={ styles.row }>
                  <Image source={ shalou }
                    style={ [ styles.icon, { transform: [ { rotate: '180deg' } ] } ] }
                  ></Image>
                  <Text style={ styles.content }>{ moment(info.startDate).format('LLL') }</Text>
                </View>
                {
                  showEndTime && (
                    <View style={ styles.row }>
                      <Image source={ shalou }
                        style={ styles.icon }
                      ></Image>
                      <Text style={ styles.content }>{ moment(info.endDate).format('LLL') }</Text>
                    </View>
                  )
                }
              </Fragment>
            )
          }
          <View style={ styles.row }>
            <Image source={ ring }
              style={ styles.icon }
            ></Image>
            <Text style={ styles.content }>{ ringText }</Text>
          </View>
        </View>
        <View style={ {
          position: 'absolute',
          bottom: -80,
          width: width - 40,
          flexDirection: 'row',
          justifyContent: 'space-around'
        } }
        >
          <TouchableOpacity
            onPress={ handleFinish }
            style={ {
              padding: 20
            } }
          >
            <Image source={ correctGreen }
              style={ styles.handleIcon }
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={ handleAbandon }
            style={ {
              padding: 20
            } }
          >
            <Image source={ wrongRed }
              style={ styles.handleIcon }
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={ handleSetting }
            style={ {
              padding: 20
            } }
          >
            <Image source={ setting }
              style={ styles.handleIcon }
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
      <Toast
        message={ toastMsg }
        setVisible={ setShowToast }
        visible={ showToast }
      />

    </Modal>
  )
}

export default (CardExpandModal)

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2F2F2F',
    width: width - 40,
    position: 'absolute',
    top: height / 2 - 200,
    left: 20,
    borderRadius: 6,
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 30,
    paddingRight: 30
  },
  cardName: {
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center'
  },
  row: {
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  circle: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginRight: 5
  },
  icon: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
    marginRight: 10
  },
  content: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '300',
    flex: 1
  },
  handleIcon: {
    height: 30,
    width: 30,
    resizeMode: 'contain'
  }
})