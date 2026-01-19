import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import chatService, { Message } from '../../services/chatService';
import { useAuthStore } from '../../store';

interface Props {
  route: {
    params?: {
      userId?: string;
      name?: string;
    };
  };
  navigation: any;
}

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const recipientId = route.params?.userId ?? 'support';
  const name = route.params?.name ?? (recipientId === 'support' ? 'Support' : 'User');
  const currentUser = useAuthStore((s) => s.user);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<FlatList<Message>>(null);

  const load = async () => {
    const msgs = await chatService.getMessages(recipientId);
    setMessages(msgs);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
  };

  useEffect(() => {
    load();
  }, [recipientId]);

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const myMsg = await chatService.sendMessage(recipientId, text, 'me');
    setMessages((m) => [...m, myMsg]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);

    // Optional: simple auto-reply to simulate conversation
    if (recipientId === 'support') {
      setTimeout(async () => {
        const reply = await chatService.sendMessage(recipientId, 'Thanks! We will get back to you shortly.', 'them');
        setMessages((m) => [...m, reply]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
      }, 600);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
      <Text style={[styles.bubbleText, item.from === 'me' ? styles.bubbleTextMe : styles.bubbleTextThem]}>
        {item.text}
      </Text>
      <Text style={[styles.time, item.from === 'me' ? styles.timeMe : styles.timeThem]}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{`Chat with ${name}`}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={listRef}
        contentContainerStyle={styles.list}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
          <Ionicons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  list: { padding: 12 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginVertical: 6,
    alignSelf: 'flex-start',
  },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
  bubbleThem: { backgroundColor: '#E9ECEF' },
  bubbleText: { fontSize: 14 },
  bubbleTextMe: { color: '#FFF' },
  bubbleTextThem: { color: '#333' },
  time: { fontSize: 10, marginTop: 4 },
  timeMe: { color: '#E0E0E0', alignSelf: 'flex-end' },
  timeThem: { color: '#666' },
});

export default ChatScreen;
