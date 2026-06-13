/**
 * LegalScreen — renders a legal document (CGU or Politique de confidentialité)
 * from src/content/legal.ts. Reached from Profil → Légal.
 */
import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {ScreenHeader, Card} from '@components/common';
import {KenteStripe} from '@components/patterns';
import {useThemedStyles, typography, spacing, borderRadius, type ThemedTokens} from '@theme';
import {LEGAL_DOCS, type LegalDoc} from '../../content/legal';

// Props are loose (any): the screen is registered in BOTH the Root and Auth stacks
// (CGU/Privacy reachable from the profile AND from the signup screen). It only reads
// route.params.doc and navigation.goBack().
const LegalScreen: React.FC<any> = ({route, navigation}) => {
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const doc: LegalDoc = route?.params?.doc === 'privacy' ? LEGAL_DOCS.privacy : LEGAL_DOCS.cgu;

  return (
    <View style={s.container}>
      <ScreenHeader title={doc.title} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[s.content, {paddingBottom: insets.bottom + spacing.xl}]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(320)}>
          <Text style={s.docTitle}>{doc.title}</Text>
          <KenteStripe height={4} style={{marginVertical: spacing.sm, width: 110}} />
          <Text style={s.updated}>Dernière mise à jour : {doc.updatedAt}</Text>
          {doc.intro.map((p, i) => (
            <Text key={i} style={s.intro}>{p}</Text>
          ))}
        </Animated.View>

        {doc.sections.map((sec, i) => (
          <Animated.View key={sec.h} entering={FadeInDown.duration(320).delay(40 + i * 18)}>
            <Card variant="default" padding={spacing.lg} style={s.card}>
              <Text style={s.h}>{sec.h}</Text>
              {sec.body.map((line, j) => (
                <Text key={j} style={s.p}>{line}</Text>
              ))}
            </Card>
          </Animated.View>
        ))}

        <Text style={s.disclaimer}>
          Ce document est fourni à titre informatif et constitue une base susceptible
          d'évoluer. WeDo est une application Atlas Studio.
        </Text>
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    content: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
    docTitle: {...typography.h2, color: colors.text.primary, fontWeight: '800'},
    updated: {...typography.caption, color: colors.text.tertiary, marginBottom: spacing.md},
    intro: {...typography.body, color: colors.text.secondary, lineHeight: 22, marginBottom: spacing.sm},
    card: {
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
      borderRadius: borderRadius.xl,
    },
    h: {...typography.h3, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.sm},
    p: {...typography.body, color: colors.text.secondary, lineHeight: 22, marginBottom: 6},
    disclaimer: {
      ...typography.caption,
      color: colors.text.tertiary,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: spacing.xl,
    },
  });

export default LegalScreen;
