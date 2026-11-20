import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/constants/theme';

type ScrollViewRef = React.ComponentRef<typeof ScrollView>;
type MeasureableView = React.ComponentRef<typeof View>;

type ScreenScrollContextValue = {
  onInputFocus: (node: MeasureableView | null) => void;
  onInputBlur: (node: MeasureableView | null) => void;
};

const ScreenScrollContext = createContext<ScreenScrollContextValue | null>(null);

export function useScreenScroll() {
  return useContext(ScreenScrollContext);
}

export type ScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
};

const KEYBOARD_CLEARANCE = 24;

/**
 * 2026 Modern Screen Container:
 * - Safe area wrapper with warm off-white background
 * - Cross-platform KeyboardAvoidingView (behavior="padding") + deterministic scroll-into-view
 *   measured in ScrollView's own window coordinate space (status-bar & edge-to-edge safe)
 * - Triggers scroll check on ScrollView layout shrink, keyboard show, and field focus changes
 * - Smooth mount fade/slide transition that clears native transforms upon completion
 *   so Android input methods (IME) and keyboards remain 100% lag-free
 * - Fully respects reduced-motion accessibility settings
 * - Max content width 480px on web, full-width on mobile
 */
export function Screen({
  children,
  style,
  contentContainerStyle,
  scrollable = true,
}: ScreenProps) {
  const theme = useTheme();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(12));
  const [animDone, setAnimDone] = useState(false);

  const scrollViewRef = useRef<ScrollViewRef>(null);
  const scrollOffsetRef = useRef(0);
  const keyboardVisibleRef = useRef(false);
  const focusedNodeRef = useRef<MeasureableView | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollViewHeightRef = useRef<number>(0);

  const scrollFocusedIntoView = useCallback(() => {
    const scrollView = scrollViewRef.current;
    const node = focusedNodeRef.current;
    if (!scrollable || !scrollView || !node || !keyboardVisibleRef.current) return;

    // Measure both ScrollView and the focused TextField in the exact same coordinate
    // space so status bar / edge-to-edge insets never skew the offset calculation.
    scrollView.measureInWindow((_sx, sy, _sw, sHeight) => {
      if (sHeight <= 0) return;
      node.measureInWindow((_nx, ny, _nw, nHeight) => {
        const visibleBottom = sy + sHeight - KEYBOARD_CLEARANCE;
        const fieldBottom = ny + nHeight;

        if (fieldBottom > visibleBottom) {
          const delta = fieldBottom - visibleBottom;
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, scrollOffsetRef.current + delta),
            animated: true,
          });
        } else if (ny < sy + spacing.sm) {
          const delta = sy + spacing.sm - ny;
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, scrollOffsetRef.current - delta),
            animated: true,
          });
        }
      });
    });
  }, [scrollable]);

  const scheduleScrollCheck = useCallback(
    (delayMs: number) => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = setTimeout(() => {
        scrollFocusedIntoView();
      }, delayMs);
    },
    [scrollFocusedIntoView]
  );

  const onInputFocus = useCallback(
    (node: MeasureableView | null) => {
      focusedNodeRef.current = node;
      if (keyboardVisibleRef.current) {
        scheduleScrollCheck(60);
      }
    },
    [scheduleScrollCheck]
  );

  const onInputBlur = useCallback((node: MeasureableView | null) => {
    if (focusedNodeRef.current === node) {
      focusedNodeRef.current = null;
    }
  }, []);

  const handleScrollViewLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextHeight = event.nativeEvent.layout.height;
      const prevHeight = lastScrollViewHeightRef.current;
      lastScrollViewHeightRef.current = nextHeight;

      // When KeyboardAvoidingView shrinks the ScrollView for the keyboard,
      // scroll the focused field into view now that native maxScrollOffset has updated.
      if (keyboardVisibleRef.current && prevHeight > 0 && nextHeight < prevHeight) {
        scheduleScrollCheck(30);
      }
    },
    [scheduleScrollCheck]
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      keyboardVisibleRef.current = true;
      // Fallback check in case ScrollView layout already settled before keyboardDidShow
      scheduleScrollCheck(150);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardVisibleRef.current = false;
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [scheduleScrollCheck]);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!isMounted) return;
        if (enabled) {
          fadeAnim.setValue(1);
          slideAnim.setValue(0);
          setAnimDone(true);
        } else {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (isMounted) {
              setAnimDone(true);
            }
          });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isMounted) {
            setAnimDone(true);
          }
        });
      });

    return () => {
      isMounted = false;
    };
  }, [fadeAnim, slideAnim]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const scrollContextValue = useMemo(
    () => ({ onInputFocus, onInputBlur }),
    [onInputFocus, onInputBlur]
  );

  // Strip native transform once mount animation finishes so Android TextInput IME
  // coordinates are never displaced or lagged by an active matrix transform
  const animatedStyle = animDone
    ? styles.animatedContent
    : [
        styles.animatedContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ];

  const innerContent = (
    <Animated.View style={animatedStyle}>
      <View style={styles.center}>
        <View style={styles.maxWidthContainer}>{children}</View>
      </View>
    </Animated.View>
  );

  return (
    <ScreenScrollContext.Provider value={scrollContextValue}>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.background },
          style,
        ]}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.keyboardAvoiding}
        >
          {scrollable ? (
            <ScrollView
              ref={scrollViewRef}
              onLayout={handleScrollViewLayout}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              keyboardDismissMode="on-drag"
              contentContainerStyle={[
                styles.scrollContainer,
                {
                  paddingHorizontal: spacing.lg,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.xl * 2,
                },
                contentContainerStyle,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {innerContent}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.staticContainer,
                { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                contentContainerStyle,
              ]}
            >
              {innerContent}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenScrollContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  staticContainer: {
    flex: 1,
  },
  animatedContent: {
    width: '100%',
  },
  center: {
    alignItems: 'center',
    width: '100%',
  },
  maxWidthContainer: {
    width: '100%',
    maxWidth: 480,
  },
});
