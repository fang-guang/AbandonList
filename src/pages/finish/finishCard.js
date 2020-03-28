/**
 * 待办项卡片item
 */
import React, { useState, Fragment, useEffect, useContext, useRef } from 'react';
import CardExpandModal from './cardExpandModal'
import { wallpaper, wrongRed, setting } from 'src/assets/image'
import { StyleSheet, Dimensions, ImageBackground, TouchableOpacity, View, Animated, PanResponder, Image, Text } from 'react-native';
import { observer } from 'mobx-react';
import srcStore from 'src/store'
import finishStore from './store'
import { elipsis, vibrate } from 'src/utils'
import themeContext from 'src/themeContext'
import nativeCalendar from 'src/utils/nativeCalendar'
import calStore from 'src/components/calendar/store'
import moment from 'moment'
import { TapGestureHandler, State } from 'react-native-gesture-handler'

const { width } = Dimensions.get('window')

// 全局唯一定时器
let pressTimeout = null
function TodoCard({ info, monthTime }) {

  const monthKey = moment(new Date(monthTime)).format('YYYY-MM')
  const [ ScaleValue ] = useState(new Animated.Value(1))
  const ScaleAnimation = Animated.timing(ScaleValue, {
    toValue: 0,
    duration: 2000
  })
  const ScaleBackAnimation = Animated.timing(ScaleValue, {
    toValue: 1,
    duration: 200
  })
  const [ expand, setExpand ] = useState(false)
  const [ isHold, setIsHold ] = useState(false)

  const [ AnimatedScaleX ] = useState(new Animated.Value(1))
  const disappearX = Animated.spring(AnimatedScaleX, { toValue: 0 })
  const [ AnimatedHeightY ] = useState(new Animated.Value(300))
  const disappearY = Animated.spring(AnimatedHeightY, { toValue: 0 })


  useEffect(() => {
    if (!isHold) {
      clearTimeout(pressTimeout)
    }
  }, [ isHold ])


  // 点击卡片右侧的恢复按钮
  const handleExpandAbandon = () => {
    setExpand(false)
    finishStore.removeHisItem(monthKey, info)
    setTimeout(() => {
      disappearX.start()
      disappearY.start()
    }, 300)
  }
  // 点击卡片右侧的删除按钮
  const handleExpandFinish = () => {
    setExpand(false)
    nativeCalendar.reCreateEvent(info).then(() => {
      // 刷新日历中的数据
      srcStore.redirectCenterWeek(srcStore.targetDate || calStore.centerSunday)
      setTimeout(() => {
        disappearX.start()
        disappearY.start()
      }, 300)
      finishStore.removeHisItem(monthKey, info)
    }).catch(err => {
      console.error(err)
    })
  }
  const theme = useContext(themeContext)

  const { isDelete } = info

  const [ animatedScale ] = useState(new Animated.Value(1))

  const _handleStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.BEGAN) {
      Animated.spring(animatedScale, {
        toValue: 0.90
      }).start(() => {
        Animated.timing(animatedScale, {
          toValue: 1,
          duration: 200
        }).start()
      })
    }
    if (nativeEvent.state === State.END) {
      vibrate(1)
      setExpand(true)
    }
  }
  // 干啥都不行
  return (
    <View>
      <TapGestureHandler
        onHandlerStateChange={ _handleStateChange }
      >
        <Animated.View style={ {
          transform: [
            { scaleY: AnimatedScaleX }
          ],
          maxHeight: AnimatedHeightY
        } }
        >
          <Animated.View
            style={ {
              transform: [
                { scale: animatedScale }
              ]
            } }
          >
            <ImageBackground
              imageStyle={ { borderRadius: 6 } }
              source={ wallpaper }
              style={ styles.card, {
                marginBottom: 6,
                height: 78,
                width: width - 60,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isDelete ? 0.6 : 1
              } }
            >
              <View style={ styles.cardHeader }>
                <View style={ [ styles.cardCircle, {
                  backgroundColor: info.calendar.color
                } ] }
                />
                <Text
                  numberOfLines={ 2 }
                  style={ [
                    styles.cardTitle, {
                      maxWidth: 200,
                      color: theme.pureText,
                      textDecorationLine: isDelete ? 'line-through' : 'none'
                    }
                  ] }
                >{ info.title }</Text>
              </View>
            </ImageBackground>
          </Animated.View>
        </Animated.View>

      </TapGestureHandler>
      { expand &&
        <CardExpandModal
          handleAbandon={ handleExpandAbandon }
          handleFinish={ handleExpandFinish }
          info={ info }
          setVisible={ setExpand }
        /> }
    </View>
  )

}

export default observer(TodoCard)

const styles = StyleSheet.create({
  // 待办卡片
  card: {
    // borderRadius: 6,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 30,
    paddingBottom: 30,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  // 卡片标题
  cardTitle: {
    // color: '#FFF',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 18
  },
  cardCircle: {
    marginTop: 3,
    height: 12,
    width: 12,
    borderRadius: 6,
    marginRight: 6
  }
})
