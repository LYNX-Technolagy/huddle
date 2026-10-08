// src/screens/DownloadDataScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import {
  generateExport,
  shareExport,
  ExportResult,
} from '../lib/dataExport';
import type { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'DownloadData'>;

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function DownloadDataScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Generate + share
  // ---------------------------------------------------------------------------

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setGenerating(true);

    try {
      const username = (user?.user_metadata?.username as string) ?? undefined;
      const res = await generateExport(username);

      if (Platform.OS === 'web') {
        // Web: trigger a Blob download
        triggerWebDownload(res);
      } else {
        // Native: open the share sheet
        await shareExport(res);
      }

      setResult(res);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareAgain = async () => {
    if (!result) return;
    try {
      if (Platform.OS === 'web') {
        triggerWebDownload(result);
      } else {
        await shareExport(result);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not share the file.');
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DOWNLOAD DATA</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <Card mangaStyle style={styles.card}>
          <Text style={styles.eyebrow}>YOUR DATA, YOUR CALL</Text>
          <Text style={styles.title}>
            EXPORT YOUR{'\n'}HUDDLE DATA
          </Text>
          <Text style={styles.body}>
            Get a copy of everything we have on file for you — your profile,
            sports, hosted games, and activity. Delivered as a JSON file you
            can save or share.
          </Text>
        </Card>

        {/* What's included */}
        <Card mangaStyle style={styles.card}>
          <Text style={styles.sectionTitle}>WHAT'S INCLUDED</Text>

          <BulletRow
            icon="person-outline"
            label="Profile"
            detail="Username, name, bio, rank, city, avatar URL"
          />
          <BulletRow
            icon="basketball-outline"
            label="Sports"
            detail="Sports you play and skill levels"
          />
          <BulletRow
            icon="calendar-outline"
            label="Games Hosted"
            detail="Full details of games you created"
          />
          <BulletRow
            icon="checkmark-done-outline"
            label="Games Joined"
            detail="Game IDs and your participation status"
          />
          <BulletRow
            icon="people-outline"
            label="Follows"
            detail="Who you follow and who follows you (usernames)"
            isLast
          />
        </Card>

        {/* What's not included — important for POPIA transparency */}
        <Card mangaStyle style={styles.card}>
          <Text style={styles.sectionTitle}>WHAT'S NOT INCLUDED</Text>
          <Text style={styles.body}>
            Other players' personal information. Game details for games you
            joined but didn't host — those belong to the host. If you need
            that, it's always visible in the app.
          </Text>
        </Card>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Success state */}
        {result && !error ? (
          <Card mangaStyle style={styles.successCard}>
            <Ionicons
              name="checkmark-circle"
              size={32}
              color={colors.success}
            />
            <Text style={styles.successTitle}>EXPORT READY</Text>
            <Text style={styles.successSub}>{result.filename}</Text>
            <TouchableOpacity
              onPress={handleShareAgain}
              style={styles.shareAgainButton}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={16} color={colors.ink} />
              <Text style={styles.shareAgainText}>SHARE AGAIN</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {/* Generate button */}
        <Button
          variant="primary"
          size="large"
          pill={false}
          onPress={handleGenerate}
          loading={generating}
          disabled={generating}
          style={styles.generateButton}
        >
          {generating ? 'GENERATING...' : 'GENERATE EXPORT'}
        </Button>

        {/* Footer note */}
        <View style={styles.footerNote}>
          <Ionicons
            name="lock-closed-outline"
            size={14}
            color={colors.textMuted}
          />
          <Text style={styles.footerText}>
            Only you can access this export. It's generated fresh each time and
            never stored on our servers.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// BulletRow
// -----------------------------------------------------------------------------

interface BulletRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  detail: string;
  isLast?: boolean;
}

const BulletRow: React.FC<BulletRowProps> = ({
  icon,
  label,
  detail,
  isLast = false,
}) => {
  return (
    <View style={[styles.bulletRow, isLast && styles.bulletRowLast]}>
      <Ionicons name={icon} size={18} color={colors.ink} />
      <View style={styles.bulletText}>
        <Text style={styles.bulletLabel}>{label}</Text>
        <Text style={styles.bulletDetail}>{detail}</Text>
      </View>
    </View>
  );
};

// -----------------------------------------------------------------------------
// Web download helper
// -----------------------------------------------------------------------------

function triggerWebDownload(result: ExportResult) {
  if (Platform.OS !== 'web') return;
  const blob = new Blob([result.json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.sporty,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },

  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },

  card: {
    padding: spacing.lg,
  },

  eyebrow: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading,
    fontSize: 22,
    lineHeight: 26,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  sectionTitle: {
    ...typography.sporty,
    fontSize: 11,
    color: colors.ink,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },

  // Bullet rows
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bulletRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  bulletText: { flex: 1 },
  bulletLabel: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  bulletDetail: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    flex: 1,
  },

  // Success
  successCard: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  successTitle: {
    ...typography.sporty,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 1.5,
    marginTop: spacing.sm,
  },
  successSub: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  shareAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
  },
  shareAgainText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 1,
  },

  // Generate
  generateButton: {
    width: '100%',
    borderRadius: 0,
    marginTop: spacing.xs,
  },

  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  footerText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    flex: 1,
  },
});