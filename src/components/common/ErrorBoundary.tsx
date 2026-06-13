/**
 * ErrorBoundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */

import React, {Component, ReactNode, ErrorInfo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, typography, spacing, iconSize} from '@theme';
import {captureError} from '@services/monitoring/atlasErrorMonitor';

interface Props {
  children: ReactNode;
  /** Optional fallback component to render */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Remonte l'erreur vers la console Atlas Studio (error-monitor/wedo).
    // Silencieux : n'impacte jamais le rendu de la fallback UI.
    void captureError({
      message: error?.message ? String(error.message) : String(error),
      stack: error?.stack ?? null,
      component: 'ErrorBoundary',
      context: errorInfo?.componentStack
        ? String(errorInfo.componentStack).slice(0, 2000)
        : 'react-render-error',
      severity: 'critical',
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Icon
                name="alert-circle-outline"
                size={iconSize['3xl']}
                color={colors.error}
              />
            </View>

            <Text style={styles.title}>Oups, une erreur s'est produite</Text>

            <Text style={styles.message}>
              Nous sommes désolés, quelque chose s'est mal passé. L'équipe technique a
              été notifiée et travaille à résoudre le problème.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Détails de l'erreur :</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Icon name="refresh" size={iconSize.md} color={colors.neutral.white} />
              <Text style={styles.buttonText}>Réessayer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                // Navigate to support or home
              }}>
              <Text style={styles.linkText}>Retour à l'accueil</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: colors.neutral[100],
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorTitle: {
    ...typography.bodyMedium,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  errorStack: {
    ...typography.caption,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  buttonText: {
    ...typography.button,
    color: colors.neutral.white,
  },
  linkButton: {
    paddingVertical: spacing.sm,
  },
  linkText: {
    ...typography.body,
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },
});

export default ErrorBoundary;
