# Guide des Composants UI - TontineDigital

Ce document décrit tous les composants UI réutilisables disponibles dans l'application.

---

## 📦 Composants Disponibles

### 1. Button

Bouton réutilisable avec plusieurs variantes et états.

#### Variantes
- `primary` - Bouton principal (fond vert)
- `secondary` - Bouton secondaire (fond or)
- `outline` - Bouton avec bordure uniquement
- `text` - Bouton texte sans fond

#### Tailles
- `small` - Petit (36px)
- `medium` - Moyen (48px) - par défaut
- `large` - Grand (56px)

#### Props
```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string; // MaterialCommunityIcons
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}
```

#### Exemples d'utilisation
```typescript
import {Button} from '@components/common';

// Bouton principal basique
<Button title="Connexion" onPress={handleLogin} />

// Bouton avec icône
<Button
  title="Créer une tontine"
  onPress={handleCreate}
  icon="plus-circle"
  iconPosition="left"
/>

// Bouton en chargement
<Button
  title="Paiement"
  onPress={handlePayment}
  loading={isProcessing}
/>

// Bouton outline pleine largeur
<Button
  title="Annuler"
  onPress={handleCancel}
  variant="outline"
  fullWidth
/>
```

---

### 2. Input

Champ de saisie avec validation, icônes et différents types.

#### Types
- `text` - Texte simple
- `email` - Email (clavier email)
- `phone` - Téléphone (pavé numérique)
- `password` - Mot de passe (masqué)
- `number` - Nombre
- `pin` - Code PIN

#### Props
```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: InputType;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  required?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  containerStyle?: ViewStyle;
  testID?: string;
}
```

#### Exemples d'utilisation
```typescript
import {Input} from '@components/common';

// Input basique
<Input
  label="Nom complet"
  value={name}
  onChangeText={setName}
  placeholder="Entrez votre nom"
/>

// Input email avec icône
<Input
  label="Email"
  type="email"
  value={email}
  onChangeText={setEmail}
  leftIcon="email-outline"
  error={emailError}
/>

// Input téléphone
<Input
  label="Numéro de téléphone"
  type="phone"
  value={phone}
  onChangeText={setPhone}
  leftIcon="phone"
  required
/>

// Input mot de passe
<Input
  label="Mot de passe"
  type="password"
  value={password}
  onChangeText={setPassword}
  helperText="Minimum 8 caractères"
/>

// Input avec compteur de caractères
<Input
  label="Description"
  value={description}
  onChangeText={setDescription}
  maxLength={500}
  showCharCount
  multiline
/>
```

---

### 3. Card

Conteneur de carte avec élévation personnalisable.

#### Props
```typescript
interface CardProps {
  children: React.ReactNode;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5 | 8;
  padding?: number;
  margin?: number;
  backgroundColor?: string;
  borderRadius?: number;
  style?: ViewStyle;
  onPress?: () => void;
  activeOpacity?: number;
  testID?: string;
}
```

#### Exemples d'utilisation
```typescript
import {Card} from '@components/common';

// Card basique
<Card>
  <Text>Contenu de la carte</Text>
</Card>

// Card avec élévation élevée
<Card elevation={5}>
  <Text>Carte importante</Text>
</Card>

// Card cliquable
<Card onPress={() => navigate('TontineDetail')}>
  <Text>Tontine Famille Diallo</Text>
  <Text>10 membres</Text>
</Card>

// Card personnalisée
<Card
  elevation={3}
  padding={24}
  backgroundColor={colors.primary[50]}
  borderRadius={16}
>
  <Text>Carte personnalisée</Text>
</Card>
```

---

### 4. Avatar

Photo de profil utilisateur avec indicateurs de statut.

#### Tailles
- `sm` - 32px
- `md` - 40px (par défaut)
- `lg` - 56px
- `xl` - 80px
- `2xl` - 120px

#### Props
```typescript
interface AvatarProps {
  imageUrl?: string;
  name?: string;
  size?: AvatarSize;
  backgroundColor?: string;
  textColor?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'busy';
  showVerified?: boolean;
  style?: ViewStyle;
  testID?: string;
}
```

#### Exemples d'utilisation
```typescript
import {Avatar} from '@components/common';

// Avatar avec image
<Avatar
  imageUrl="https://example.com/photo.jpg"
  size="md"
/>

// Avatar avec initiales
<Avatar
  name="Jean Kouassi"
  size="lg"
/>

// Avatar avec statut en ligne
<Avatar
  imageUrl={user.photoUrl}
  name={user.name}
  showStatus
  status="online"
/>

// Avatar vérifié
<Avatar
  imageUrl={user.photoUrl}
  name={user.name}
  showVerified
  size="xl"
/>
```

---

### 5. Badge

Badges pour réputation, statut et compteurs.

#### Variantes
- `reputation` - Badge de réputation (Bronze, Argent, Or, Platine, Diamant)
- `status` - Indicateur de statut
- `count` - Badge de compteur (notifications, etc.)
- `tag` - Tag générique

#### Props
```typescript
interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'small' | 'medium' | 'large';
  label?: string;
  icon?: string;
  reputationLevel?: ReputationLevel;
  reputationScore?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  testID?: string;
}
```

#### Exemples d'utilisation
```typescript
import {Badge} from '@components/common';
import {ReputationLevel} from '@types';

// Badge de réputation
<Badge
  variant="reputation"
  reputationLevel={ReputationLevel.GOLD}
  reputationScore={650}
/>

// Badge de statut
<Badge
  variant="status"
  label="Actif"
  color={colors.success}
/>

// Badge de compteur
<Badge
  variant="count"
  label="5"
  size="small"
/>

// Tag personnalisé
<Badge
  variant="tag"
  label="Famille"
  icon="account-group"
/>
```

---

### 6. ProgressBar

Barre de progression animée pour tontines.

#### Props
```typescript
interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  color?: string;
  backgroundColor?: string;
  useGradient?: boolean;
  gradientColors?: string[];
  animated?: boolean;
  style?: ViewStyle;
  testID?: string;
}
```

#### Exemples d'utilisation
```typescript
import {ProgressBar} from '@components/common';

// Barre de progression basique
<ProgressBar progress={65} />

// Avec pourcentage et label
<ProgressBar
  progress={75}
  showPercentage
  showLabel
  label="Tontine en cours"
/>

// Sans gradient, couleur personnalisée
<ProgressBar
  progress={30}
  useGradient={false}
  color={colors.warning}
/>

// Hauteur personnalisée
<ProgressBar
  progress={90}
  height={12}
  showPercentage
/>
```

---

### 7. LoadingSpinner

Indicateur de chargement.

#### Props
```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullscreen?: boolean;
  style?: ViewStyle;
  testID?: string;
}
```

#### Exemples d'utilisation
```typescript
import {LoadingSpinner} from '@components/common';

// Spinner basique
<LoadingSpinner />

// Avec texte
<LoadingSpinner
  text="Chargement des tontines..."
  size="large"
/>

// Plein écran
<LoadingSpinner
  fullscreen
  text="Traitement du paiement..."
/>

// Petit spinner dans un bouton
<LoadingSpinner
  size="small"
  color={colors.text.inverse}
/>
```

---

### 8. EmptyState

Affichage pour état vide (pas de données).

#### Props
```typescript
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconSize?: number;
  iconColor?: string;
  style?: ViewStyle;
  testID?: string;
}
```

#### Exemples d'utilisation
```typescript
import {EmptyState} from '@components/common';

// État vide basique
<EmptyState
  title="Aucune tontine"
  description="Vous n'avez pas encore rejoint de tontine"
/>

// Avec action
<EmptyState
  icon="wallet-plus"
  title="Créez votre première tontine"
  description="Commencez à économiser avec vos proches"
  actionLabel="Créer une tontine"
  onAction={handleCreateTontine}
/>

// État vide personnalisé
<EmptyState
  icon="message-outline"
  iconColor={colors.neutral[400]}
  title="Aucun message"
  description="Vos conversations apparaîtront ici"
/>
```

---

## 🎨 Utilisation avec le Thème

Tous les composants utilisent automatiquement le système de thème. Vous pouvez les personnaliser :

```typescript
import {colors, spacing, borderRadius} from '@theme';

<Button
  title="Personnalisé"
  style={{
    backgroundColor: colors.secondary.main,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  }}
/>
```

---

## 📝 Best Practices

### 1. Importation
```typescript
// ✅ Bon - Import depuis index
import {Button, Input, Card} from '@components/common';

// ❌ Éviter - Import direct
import Button from '@components/common/Button';
```

### 2. Props par défaut
Les composants ont des valeurs par défaut sensées. Ne spécifiez que ce qui change :

```typescript
// ✅ Bon
<Button title="Confirmer" onPress={handleConfirm} />

// ❌ Inutile
<Button
  title="Confirmer"
  onPress={handleConfirm}
  variant="primary"  // Déjà par défaut
  size="medium"      // Déjà par défaut
/>
```

### 3. Accessibilité
Utilisez toujours `testID` pour les tests :

```typescript
<Button
  title="Connexion"
  onPress={handleLogin}
  testID="login-button"
/>
```

### 4. Composition
Composez les composants pour créer des interfaces complexes :

```typescript
<Card onPress={handlePress}>
  <View style={styles.header}>
    <Avatar
      imageUrl={user.photoUrl}
      name={user.name}
      size="md"
    />
    <Badge
      variant="reputation"
      reputationLevel={user.reputationLevel}
    />
  </View>

  <Text style={styles.title}>{tontine.name}</Text>

  <ProgressBar
    progress={tontine.progress}
    showPercentage
  />

  <Button
    title="Voir détails"
    onPress={handleViewDetails}
    variant="outline"
    fullWidth
  />
</Card>
```

---

## 🧪 Tests

Tous les composants sont testables avec `testID` :

```typescript
import {render, fireEvent} from '@testing-library/react-native';
import {Button} from '@components/common';

test('Button calls onPress when pressed', () => {
  const onPress = jest.fn();
  const {getByTestId} = render(
    <Button
      title="Test"
      onPress={onPress}
      testID="test-button"
    />
  );

  fireEvent.press(getByTestId('test-button'));
  expect(onPress).toHaveBeenCalled();
});
```

---

**Dernière mise à jour** : 2025-11-03
