import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    image: require('@/assets/images/onboarding1.jpg'),
    tag: 'PREMIUM',
    title: 'Barbearia de\nNível Superior',
    subtitle: 'Gerencie sua barbearia com a segurança e eficiência de um sistema bancário.',
  },
  {
    id: 2,
    image: require('@/assets/images/onboarding2.jpg'),
    tag: 'PROFISSIONAL',
    title: 'Ferramentas para\nBarbeiros Modernos',
    subtitle: 'Controle total da sua agenda, clientes e horários em um único aplicativo.',
  },
  {
    id: 3,
    image: require('@/assets/images/onboarding3.jpg'),
    tag: 'INTELIGENTE',
    title: 'Agendamento\nSimplificado',
    subtitle: 'Clientes agendam em segundos. Você recebe notificações em tempo real.',
  },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map(slide => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            <Image
              source={slide.image}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['transparent', 'rgba(8,11,17,0.6)', Colors.background]}
              locations={[0.3, 0.6, 1]}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        ))}
      </ScrollView>

      {/* Content overlay */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{SLIDES[activeIndex].tag}</Text>
          </View>
        </View>

        <Text style={styles.title}>{SLIDES[activeIndex].title}</Text>
        <Text style={styles.subtitle}>{SLIDES[activeIndex].subtitle}</Text>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>

        <Button
          title={activeIndex < SLIDES.length - 1 ? 'Continuar' : 'Começar Agora'}
          onPress={handleNext}
          size="lg"
          fullWidth
          style={styles.btn}
        />

        <Pressable onPress={() => router.replace('/login')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Já tenho conta</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  slide: { height },

  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },

  tagRow: { flexDirection: 'row' },
  tag: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 1.5,
  },

  title: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  dots: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },

  btn: { marginTop: 4 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
