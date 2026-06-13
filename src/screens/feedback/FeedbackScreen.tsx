/**
 * FeedbackScreen — submit an avis / suggestion / bug, and review past ones.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  ScreenHeader,
  Button,
  Card,
  SegmentedControl,
  PressableScale,
  useToast,
} from '@components/common';
import {KenteStripe} from '@components/patterns';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import feedbackApi, {type Feedback, type FeedbackKind} from '@services/api/feedback.api';

const KINDS: {label: string; value: FeedbackKind}[] = [
  {label: 'Avis', value: 'avis'},
  {label: 'Suggestion', value: 'suggestion'},
  {label: 'Bug', value: 'bug'},
];

const KIND_LABEL: Record<string, string> = {
  avis: 'Avis',
  suggestion: 'Suggestion',
  bug: 'Bug',
  autre: 'Autre',
};

const FeedbackScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const {show} = useToast();

  const [kind, setKind] = useState<FeedbackKind>('avis');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [past, setPast] = useState<Feedback[]>([]);

  const load = useCallback(async () => {
    try {
      setPast(await feedbackApi.getMyFeedback());
    } catch {
      /* non-blocking */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (message.trim().length < 3) {
      show('Écrivez quelques mots avant d’envoyer.', {type: 'error'});
      return;
    }
    setSubmitting(true);
    try {
      await feedbackApi.submitFeedback({
        kind,
        message,
        rating: kind === 'avis' && rating > 0 ? rating : undefined,
        appVersion: '1.0.0',
      });
      show('Merci ! Votre retour a bien été envoyé.', {type: 'success'});
      setMessage('');
      setRating(0);
      await load();
    } catch (e: any) {
      show(e?.message ?? "L'envoi a échoué. Réessayez.", {type: 'error'});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.container}>
      <ScreenHeader title="Votre avis compte" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(360)}>
            <Card variant="default" padding={spacing.lg}>
              <Text style={s.label}>Type de retour</Text>
              <SegmentedControl
                options={KINDS}
                value={kind}
                onChange={v => setKind(v as FeedbackKind)}
                style={{marginTop: spacing.sm, marginBottom: spacing.md}}
              />

              {kind === 'avis' && (
                <>
                  <Text style={s.label}>Votre note</Text>
                  <View style={s.stars}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <PressableScale key={n} onPress={() => setRating(n)}>
                        <Icon
                          name={n <= rating ? 'star' : 'star-outline'}
                          size={34}
                          color={n <= rating ? colors.brand.gold : colors.border.strong}
                        />
                      </PressableScale>
                    ))}
                  </View>
                </>
              )}

              <Text style={[s.label, {marginTop: spacing.md}]}>Votre message</Text>
              <TextInput
                style={s.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Dites-nous ce que vous aimez, ce qui manque, ou un problème rencontré…"
                placeholderTextColor={colors.text.hint}
                multiline
                numberOfLines={5}
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={s.counter}>{message.length}/1000</Text>

              <KenteStripe height={4} style={{marginVertical: spacing.md, opacity: 0.9}} />
              <Button
                title="Envoyer mon retour"
                onPress={submit}
                loading={submitting}
                disabled={submitting}
                variant="gradient"
                gradient="sunset"
                fullWidth
                size="large"
                icon="send"
              />
            </Card>
          </Animated.View>

          {past.length > 0 && (
            <Animated.View entering={FadeInDown.duration(360).delay(80)} style={{marginTop: spacing.xl}}>
              <Text style={s.sectionTitle}>Mes retours précédents</Text>
              {past.map((f, i) => (
                <Animated.View key={f.id} entering={FadeInDown.delay(100 + i * 40).duration(300)}>
                  <Card variant="outline" padding={spacing.md} style={{marginBottom: spacing.sm}}>
                    <View style={s.pastHeader}>
                      <Text style={s.pastKind}>{KIND_LABEL[f.kind] ?? f.kind}</Text>
                      {f.rating ? (
                        <View style={s.pastStars}>
                          {Array.from({length: f.rating}).map((_, k) => (
                            <Icon key={k} name="star" size={13} color={colors.brand.gold} />
                          ))}
                        </View>
                      ) : null}
                      <Text style={s.pastStatus}>
                        {f.status === 'resolved' ? 'Traité' : f.status === 'seen' ? 'Vu' : 'Reçu'}
                      </Text>
                    </View>
                    <Text style={s.pastMessage}>{f.message}</Text>
                  </Card>
                </Animated.View>
              ))}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    content: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing['2xl']},
    label: {...typography.captionMedium, color: colors.text.secondary, fontWeight: '700'},
    stars: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm},
    input: {
      ...typography.body,
      color: colors.text.primary,
      backgroundColor: colors.bg.subtle,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginTop: spacing.sm,
      minHeight: 120,
    },
    counter: {...typography.small, color: colors.text.tertiary, textAlign: 'right', marginTop: 4},
    sectionTitle: {...typography.h3, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.md},
    pastHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4},
    pastKind: {...typography.captionMedium, color: colors.brand.terracotta, fontWeight: '700'},
    pastStars: {flexDirection: 'row', gap: 1},
    pastStatus: {...typography.small, color: colors.text.tertiary, marginLeft: 'auto'},
    pastMessage: {...typography.caption, color: colors.text.secondary, lineHeight: 18},
  });

export default FeedbackScreen;
