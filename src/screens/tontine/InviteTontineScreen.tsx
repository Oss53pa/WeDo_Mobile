/**
 * InviteTontineScreen — share a tontine invitation: branded code, decorative
 * QR emblem and quick share actions (link / SMS / WhatsApp). Premium themed UI.
 */
import React from 'react';
import {View, Text, StyleSheet, ScrollView, Share, Alert} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  Button,
  ScreenHeader,
  GradientCard,
  Card,
} from '@components/common';
import {KenteEmblem, KenteStripe} from '@components/patterns';
import {
  QRCodeIcon,
  ShareIcon,
  LinkIcon,
  CopyIcon,
} from '@components/icons';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  type ThemedTokens,
} from '@theme';
import {RootStackParamList} from '@navigation/types';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Nav = StackNavigationProp<RootStackParamList, 'InviteTontine'>;
type Route = RouteProp<RootStackParamList, 'InviteTontine'>;

const InviteTontineScreen: React.FC<{navigation: Nav; route: Route}> = ({
  navigation,
  route,
}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const tontineId = route.params?.tontineId ?? '';
  const tontineName = route.params?.tontineName ?? 'votre tontine';
  const link = `https://wedo.app/join/${tontineId}`;
  const code =
    tontineId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'WEDO2026';

  const shareLink = async (channel?: string) => {
    try {
      await Share.share({
        message: `Rejoignez ma tontine sur WeDo : ${link}`,
        title: 'Invitation WeDo',
      });
    } catch {
      Alert.alert(
        'Partage indisponible',
        `Impossible d'ouvrir le partage${channel ? ` (${channel})` : ''}. Le lien reste disponible ci-dessous.`,
      );
    }
  };

  const handleCopy = () => {
    Alert.alert('Lien prêt à partager', link, [
      {text: 'Fermer', style: 'cancel'},
      {text: 'Partager', onPress: () => shareLink()},
    ]);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Inviter des membres"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={[
          s.content,
          {paddingBottom: insets.bottom + spacing.lg},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Hero — branded invitation code */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <GradientCard
            gradient="sunset"
            motif="diamonds"
            motifOpacity={0.14}
            style={s.hero}>
            <Text style={s.heroLabel}>Code d'invitation</Text>
            <Text style={s.heroCode}>{code}</Text>
            <KenteStripe height={5} style={s.heroStripe} />
            <Text style={s.heroName} numberOfLines={1}>
              {tontineName}
            </Text>
            <Text style={s.heroHint}>
              Partagez ce code ou le lien pour inviter de nouveaux membres.
            </Text>
          </GradientCard>
        </Animated.View>

        {/* Decorative QR */}
        <Animated.View entering={FadeInDown.duration(360).delay(80)}>
          <Card variant="default" padding={spacing.lg} style={s.qrCard}>
            <View style={s.qrFrame}>
              <KenteEmblem size={140} />
              <View style={s.qrIconWrap}>
                <QRCodeIcon size={48} color={colors.brand.indigo} />
              </View>
            </View>
            <Text style={s.qrCaption}>Scannez pour rejoindre</Text>
          </Card>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInDown.duration(360).delay(160)}
          style={s.actions}>
          <Button
            title="Partager le lien"
            variant="gradient"
            gradient="sunset"
            onPress={() => shareLink()}
            fullWidth
            size="large"
            leftNode={
              <ShareIcon size={20} color="#FFFFFF" />
            }
          />
          <View style={s.actionRow}>
            <Button
              title="Inviter par SMS"
              variant="outline"
              onPress={() => shareLink('SMS')}
              icon="message-text-outline"
              style={s.actionHalf}
            />
            <Button
              title="WhatsApp"
              variant="outline"
              onPress={() => shareLink('WhatsApp')}
              icon="whatsapp"
              style={s.actionHalf}
            />
          </View>
        </Animated.View>

        {/* Shareable link */}
        <Animated.View entering={FadeInDown.duration(360).delay(220)}>
          <Card variant="outline" padding={spacing.md} style={s.linkCard}>
            <View style={s.linkIcon}>
              <LinkIcon size={20} color={colors.brand.indigo} />
            </View>
            <View style={s.linkBody}>
              <Text style={s.linkLabel}>Lien d'invitation</Text>
              <Text style={s.linkValue} selectable numberOfLines={1}>
                {link}
              </Text>
            </View>
            <Button
              title="Copier"
              variant="ghost"
              size="small"
              onPress={handleCopy}
              leftNode={<CopyIcon size={18} color={colors.accent.main} />}
              textStyle={{color: colors.accent.main}}
            />
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    content: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
    hero: {marginBottom: spacing.lg, alignItems: 'center'},
    heroLabel: {
      ...typography.captionMedium,
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    heroCode: {
      ...typography.displaySmall,
      color: '#FFFFFF',
      fontWeight: '800',
      letterSpacing: 4,
      marginTop: spacing.xs,
    },
    heroStripe: {width: 120, marginVertical: spacing.md},
    heroName: {
      ...typography.h3,
      color: '#FFFFFF',
      fontWeight: '700',
      textAlign: 'center',
    },
    heroHint: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      marginTop: spacing.xs,
      lineHeight: 18,
    },
    qrCard: {alignItems: 'center', marginBottom: spacing.lg},
    qrFrame: {
      width: 180,
      height: 180,
      borderRadius: borderRadius.xl,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    qrIconWrap: {position: 'absolute', alignItems: 'center', justifyContent: 'center'},
    qrCaption: {
      ...typography.bodyMedium,
      color: colors.text.secondary,
      fontWeight: '600',
      marginTop: spacing.md,
    },
    actions: {gap: spacing.md, marginBottom: spacing.lg},
    actionRow: {flexDirection: 'row', gap: spacing.md},
    actionHalf: {flex: 1},
    linkCard: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
    linkIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.brand.indigoSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linkBody: {flex: 1},
    linkLabel: {...typography.caption, color: colors.text.tertiary},
    linkValue: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
  });

export default InviteTontineScreen;
