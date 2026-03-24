import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date)) return '';
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MessageBubble({ message, isOwn, senderName }) {
  if (!message) return null;

  const { message_text, created_at, flagged } = message;

  return (
    <View style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}>
      {!isOwn && senderName ? (
        <Text style={styles.senderName}>{senderName}</Text>
      ) : null}

      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          flagged && styles.bubbleFlagged,
        ]}
      >
        <Text style={[styles.messageText, isOwn ? styles.messageTextOwn : styles.messageTextOther]}>
          {message_text}
        </Text>
      </View>

      <Text style={[styles.timeText, isOwn ? styles.timeOwn : styles.timeOther]}>
        {formatTime(created_at)}
      </Text>

      {flagged ? (
        <View style={[styles.flaggedRow, isOwn ? styles.flaggedRowOwn : styles.flaggedRowOther]}>
          <Ionicons name="warning-outline" size={12} color={colors.warning} />
          <Text style={styles.flaggedText}>  Flagged content</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 3,
    marginHorizontal: 14,
    maxWidth: '76%',
  },
  wrapperOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapperOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  bubbleFlagged: {
    borderWidth: 1,
    borderColor: colors.warning,
    opacity: 0.85,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
    marginHorizontal: 4,
  },
  timeOwn: {
    textAlign: 'right',
  },
  timeOther: {
    textAlign: 'left',
  },
  flaggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    marginHorizontal: 4,
  },
  flaggedRowOwn: {
    justifyContent: 'flex-end',
  },
  flaggedRowOther: {
    justifyContent: 'flex-start',
  },
  flaggedText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '500',
  },
});
