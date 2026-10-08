// src/components/ReportUserModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import {
  submitReport,
  ReportReason,
  REPORT_REASON_LABELS,
} from '../lib/moderation';

interface ReportUserModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUsername: string;
  onSuccess?: () => void;
}

const REASONS: ReportReason[] = [
  'harassment',
  'spam',
  'fake_profile',
  'inappropriate_content',
  'no_show',
  'other',
];

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  visible,
  onClose,
  reportedUserId,
  reportedUsername,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setSelectedReason(null);
    setDetails('');
    setSubmitting(false);
    setError(null);
    setDone(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason || submitting) return;

    setSubmitting(true);
    setError(null);

    const { error: submitErr } = await submitReport({
      reportedUserId,
      reason: selectedReason,
      details: details.trim() || undefined,
    });

    setSubmitting(false);

    if (submitErr) {
      setError(submitErr.message);
      return;
    }

    setDone(true);
    onSuccess?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={styles.content}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {done ? 'REPORT SENT' : 'REPORT USER'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {done ? (
            <View style={styles.successBlock}>
              <Ionicons
                name="checkmark-circle"
                size={40}
                color={colors.success}
              />
              <Text style={styles.successTitle}>THANK YOU</Text>
              <Text style={styles.successBody}>
                Your report has been received. Our team will review it and
                take action if needed. We don't share who reported what, so
                your privacy is protected.
              </Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.subtitle}>
                Reporting{' '}
                <Text style={styles.subtitleName}>
                  @{reportedUsername}
                </Text>
              </Text>

              <Text style={styles.label}>WHY ARE YOU REPORTING THIS USER?</Text>

              {REASONS.map((reason) => {
                const active = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonRow, active && styles.reasonRowActive]}
                    onPress={() => setSelectedReason(reason)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text
                      style={[
                        styles.reasonText,
                        active && styles.reasonTextActive,
                      ]}
                    >
                      {REPORT_REASON_LABELS[reason]}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.label, { marginTop: spacing.lg }]}>
                DETAILS (OPTIONAL)
              </Text>
              <TextInput
                style={styles.detailsInput}
                value={details}
                onChangeText={setDetails}
                placeholder="Add any context that would help us understand"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={!submitting}
              />
              <Text style={styles.charCount}>{details.length} / 500</Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color={colors.error}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedReason || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.textLight} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>SUBMIT REPORT</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '85%',
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.ink,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  headerTitle: {
    ...typography.sporty,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 2,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flexGrow: 0 },
  scrollContent: { padding: spacing.lg },

  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  subtitleName: {
    fontWeight: '700',
    color: colors.ink,
  },

  label: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },

  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  reasonRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  reasonText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  reasonTextActive: {
    color: colors.ink,
    fontWeight: '600',
  },

  detailsInput: {
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.ink,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  charCount: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    flex: 1,
  },

  submitButton: {
    paddingVertical: spacing.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.error,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    ...typography.button,
    fontSize: 13,
    color: colors.textLight,
    letterSpacing: 1,
  },

  successBlock: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  successTitle: {
    ...typography.sporty,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 2,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  successBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  doneButton: {
    width: '100%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  doneButtonText: {
    ...typography.button,
    fontSize: 13,
    color: colors.textLight,
    letterSpacing: 1,
  },
});