/*
 * @Descripttion :
 * @Author       : lizhaokang
 * @Date         : 2020-03-25 10:15:01
 */
/**
 * 待办项卡片item
 */
import React, { useState, useEffect, useContext, useRef } from 'react';
import CardExpandModal from './cardExpandModal'
import { correctGreen, wrongRed, setting } from 'src/assets/image'
import { StyleSheet, TouchableOpacity, View, Animated, PanResponder, Image, Text } from 'react-native';
import { observer } from 'mobx-react';
import srcStore from 'src/store'
import { fromNow, elipsis, vibrate } from 'src/utils'
import nativeCalendar from 'src/utils/nativeCalendar'
import themeContext from 'src/themeContext'
import mainStore from './store'
import calStore from 'src/components/calendar/store'



// 全局唯一定时器
let pressTimeout = null
// 唯二1
let timeout1
function TodoCard({ info, navigation }) {
  useEffect(() => {
    return () => {
      // component will unmount
      clearTimeout(timeout1)
    }
  }, [])
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


  // 因为useState的异步性,需要额外使用一个控制变量
  const handlePressIn = () => {
    setIsHold(true)
    ScaleAnimation.start()
    clearTimeout(pressTimeout)
    pressTimeout = setTimeout(() => {
      vibrate()
      ScaleAnimation.stop()
      ScaleBackAnimation.start(() => {
        srcStore.preventOtherHandler = true
        setExpand(true)
        setIsHold(false)
      })
    }, 400)
  }
  // 点击展开卡片的完成按钮
  const handleExpandFinish = () => {
    setExpand(false)
    setFinish(true)
    Promise.all([
      new Promise(resolve => {
        opacityAnimation.start(() => resolve())
      }),
      new Promise(resolve => {
        // 第二个参数传false,因为一般只完成当次
        nativeCalendar.removeEvent(info, false)
          .then(() => resolve())
      })
    ]).finally(() => {
      srcStore.redirectCenterWeek(srcStore.targetDate || calStore.centerSunday)
    })
  }
  // 点击展开卡片的删除按钮
  const handleExpandAbandon = () => {
    setExpand(false)
    setFinish(false)
    Promise.all([
      new Promise(resolve => {
        opacityAnimation.start(() => resolve())
      }),
      new Promise(resolve => {
        // 第二个参数传true, 全部删除
        nativeCalendar.removeEvent(info, true)
          .then(() => resolve())
      })
    ]).finally(() => {
      srcStore.redirectCenterWeek(srcStore.targetDate || calStore.centerSunday)
    })
  }

  useEffect(() => {
    if (!isHold) {
      clearTimeout(pressTimeout)
    }
  }, [ isHold ])
  const handlePressOut = () => {
    setIsHold(false)
    ScaleAnimation.stop()
    ScaleBackAnimation.start()
  }
  const handlePressEdit = () => {
    TranslateXAnimationCenter.start()
    navigation.navigate('Add', {
      info
    })
    setIsLeft('center')
  }
  // 点击卡片右侧的完成按钮
  const handlePressFinish = () => {
    setFinish(true)
    TranslateToCenter(() => {
      srcStore.updateFocusCardId('')
      Promise.all([
        new Promise(resolve => {
          opacityAnimation.start(() => resolve())
        }),
        new Promise(resolve => {
          // 第二个参数传false,因为一般只完成当次
          nativeCalendar.removeEvent(info, false)
            .then(() => resolve())
        })
      ]).finally(() => {
        srcStore.redirectCenterWeek(srcStore.targetDate || calStore.centerSunday)
      })
    })
  }
  // 点击卡片右侧的删除按钮
  const handlePressAbandon = () => {
    setFinish(false)
    TranslateToCenter(() => {
      Promise.all([
        new Promise(resolve => {
          opacityAnimation.start(() => resolve())
        }),
        new Promise(resolve => {
          // 第二个参数传true,因为删除一般是针对整个事件而言
          nativeCalendar.removeEvent(info, true)
            .then(() => resolve())
        })
      ]).finally(() => {
        srcStore.redirectCenterWeek(srcStore.targetDate || calStore.centerSunday)
      })
    })
  }
  // 控制左右滑动效果
  const [ moveY ] = useState(new Animated.Value(0))
  const [ AnimatedIconOpacity ] = useState(new Animated.Value(0))
  const AnimatedIconOpacityReverse = AnimatedIconOpacity.interpolate({
    inputRange: [ 0, 1 ],
    outputRange: [ 1, 0 ]
  })
  const [ finish, setFinish ] = useState(true)
  const opacityAnimation = Animated.timing(AnimatedIconOpacity, {
    toValue: 1,
    duration: 500
  })
  const TranslateXAnimationLeft = Animated.timing(moveY, {
    toValue: -140,
    duration: 300
  })
  const TranslateXAnimationRight = Animated.timing(moveY, {
    toValue: 70,
    duration: 300
  })
  const TranslateXAnimationCenter = Animated.timing(moveY, {
    toValue: 0,
    duration: 300
  })
  const TranslateToLeft = (endHandler) => {
    Animated.timing(moveY, {
      toValue: isLeft === 'left' ? 0 : -140,
      duration: 300
    }).start(() => {
      if (typeof endHandler === 'function') {
        endHandler()
      }
    })
  }
  const TranslateToRight = endHandler => {
    Animated.timing(moveY, {
      toValue: isLeft === 'right' ? 0 : 70,
      duration: 300
    }).start(() => {
      if (typeof endHandler === 'function') {
        endHandler()
      }
    })
  }
  const TranslateToCenter = (endHandler) => {
    if (isLeft === 'left') {
      Animated.timing(moveY, {
        toValue: 140,
        duration: 300
      }).start(() => {
        setIsLeft('center')
        moveY.setValue(0)
        if (typeof endHandler === 'function') {
          endHandler()
        }
      })
    } else if (isLeft === 'right') {
      Animated.timing(moveY, {
        toValue: -70,
        duration: 300
      }).start(() => {
        setIsLeft('center')
        moveY.setValue(0)
        if (typeof endHandler === 'function') {
          endHandler()
        }
      })
    }
  }

  // 点击展开卡片的编辑功能
  const handleExpandSetting = () => {
    setExpand(false)
    navigation.navigate('Add', {
      info
    })
  }

  const AnimatedTranslateX = moveY.interpolate({
    inputRange: [ -211, -210, -140, 0, 70, 140, 141 ],
    outputRange: [ -210, -210, -140, 0, 70, 140, 140 ]
  })

  const AnimatedTranslateX_left = moveY.interpolate({
    inputRange: [ -140, -70, 0, 140, 210, 211 ],
    outputRange: [ -245, -210, -140, 0, 30, 30 ]
  })
  const AnimatedTranslateX_right = moveY.interpolate({
    inputRange: [ -141, -140, -70, 0, 70, 210, 211 ],
    outputRange: [ -30, -30, 0, 70, 140, 210, 210 ]
  })

  const [ isLeft, setIsLeft ] = useState('center')
  const _handleMoveEnd = (eve, gesture) => {
    mainStore.updatePreventScroll(false)
    mainStore.updateIsScroll(false)
    handlePressOut()
    const { dx } = gesture
    if (isLeft === 'left') {
      if (dx > 10) {
        TranslateToCenter(() => srcStore.updateFocusCardId(''))
      } else {
        TranslateToLeft()
      }
    } else if (isLeft === 'right') {
      if (dx < -10) {
        TranslateToCenter(() => srcStore.updateFocusCardId(''))
      } else {
        TranslateToRight()
      }
    } else if (isLeft === 'center') {
      if (dx > 50) {
        srcStore.updateFocusCardId(info.id)
        TranslateXAnimationRight.start(() => {
          setIsLeft('right')
          moveY.setValue(0)
        })
      } else if (dx < -50) {
        srcStore.updateFocusCardId(info.id)
        TranslateXAnimationLeft.start(() => {
          setIsLeft('left')
          moveY.setValue(0)
        })
      } else {
        TranslateXAnimationCenter.start()
      }
    }
  }

  // 检测是否有其他卡片被操作了,恢复当前卡片为center状态
  const focusCardId = srcStore.focusCardId

  useEffect(() => {
    if (srcStore.focusCardId !== info.id) {
      if (isLeft === 'left') {
        Animated.timing(moveY, {
          toValue: 140,
          duration: 300
        }).start(() => {
          setIsLeft('center')
          moveY.setValue(0)
        })
      } else if (isLeft === 'right') {
        Animated.timing(moveY, {
          toValue: -70,
          duration: 300
        }).start(() => {
          setIsLeft('center')
          moveY.setValue(0)
        })
      }
    }
  }, [ focusCardId ])

  const _panHandlers = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: () => {
      // mainStore.updatePreventScroll(false)
      mainStore.updateIsScroll(true)
      if (isLeft === 'center') {
        handlePressIn()
      }
    },
    onPanResponderMove: (eve, gesture) => {
      const { dx } = gesture
      // 当出现左滑/右滑动作时,展开动作结束
      if (Math.abs(dx) > 2) {
        handlePressOut()
        // mainStore.updatePreventScroll(true)
      }
      moveY.setValue(dx)
    },
    onPanResponderTerminate: _handleMoveEnd,
    onPanResponderRelease: _handleMoveEnd
  })

  const fromNowTime = fromNow(info)

  const theme = useContext(themeContext)


  return (
    <View>
      <Animated.View style={ {
        transform: [
          { translateX: isLeft === 'center' ? AnimatedTranslateX : ( isLeft === 'left' ? AnimatedTranslateX_left : AnimatedTranslateX_right) }
        ]
      } }
      >
        <Animated.View
          { ..._panHandlers.panHandlers }
          style={ [ styles.card,{
            backgroundColor: theme.mainColor,
            opacity: isHold ? 0.6 : 1,
            transform: [
              { scale: ScaleValue }
            ]
          } ] }
        >
          <View style={ styles.cardHeader }>
            <Animated.View style={ [ styles.cardCircle, {
              backgroundColor: info.calendar.color,
              // transform: [ { translateX: AnimatedTextTranslateX } ],
              opacity: AnimatedIconOpacityReverse
            } ] }
            />
            <Animated.Text style={ [
              styles.cardTitle, {
                maxWidth: 200,
                color: theme.pureText,
                // transform: [ { translateX: AnimatedTextTranslateX } ],
                opacity: AnimatedIconOpacityReverse
              }
            ] }
            >{ elipsis(info.title, 50) }</Animated.Text>
          </View>
          <Animated.Text style={ [ styles.timeLeft, {
            color: theme.subText,
            // transform: [ { translateX: AnimatedTextTranslateX } ],
            opacity: AnimatedIconOpacityReverse
          } ] }
          >{ fromNowTime }</Animated.Text>
          <View style={ styles.absoluteWrapper }>
            <Animated.Image source={ finish ? correctGreen : wrongRed }
              style={ [ styles.handleIcon, {
                opacity: AnimatedIconOpacity
              } ] }
            />
          </View>
        </Animated.View>
        <View style={ styles.handleContainer }>
          <TouchableOpacity onPress={ handlePressFinish }>
            <View style={ styles.iconItem }>
              <Image source={ correctGreen }
                style={ styles.handleIcon }
              ></Image>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={ handlePressAbandon }>
            <View style={ styles.iconItem }>
              <Image source={ wrongRed }
                style={ styles.handleIcon }
              ></Image>
            </View>
          </TouchableOpacity>
        </View>
        <View style={ styles.editContainer }>
          <TouchableOpacity
            onPress={ handlePressEdit }
            style={ {
              height: 60,
              width: 60,
              justifyContent: 'center',
              alignItems: 'center'
            } }
          >
            <Image source={ setting }
              style={ styles.editIcon }
            ></Image>
          </TouchableOpacity>
        </View>
      </Animated.View>
      { expand &&
      <CardExpandModal
        handleAbandon={ handleExpandAbandon }
        handleFinish={ handleExpandFinish }
        handleSetting={ handleExpandSetting }
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
    borderRadius: 6,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 4, height: 4 }
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
    // paddingTop: 6,
    marginTop: 3,
    height: 12,
    width: 12,
    borderRadius: 6,
    marginRight: 6
  },
  handleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    position: 'absolute',
    top: 0,
    right: -140
  },
  editContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
    position: 'absolute',
    top: 0,
    left: -70
  },
  editIcon: {
    height: 30,
    width: 30
  },
  iconItem: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60
  },
  handleIcon: {
    height: 30,
    width: 30,
    resizeMode: 'contain',
    borderWidth: 10,
    borderColor: 'transparent'
  },
  absoluteWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  timeLeft: {
    // color: '#999',
    fontSize: 14,
    marginTop: 6
  }
})
