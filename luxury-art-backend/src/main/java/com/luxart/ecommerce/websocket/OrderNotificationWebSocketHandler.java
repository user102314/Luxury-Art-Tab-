package com.luxart.ecommerce.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luxart.ecommerce.dto.AdminNotificationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Listener WebSocket admin : chaque onglet admin connecté reçoit les nouvelles commandes en push.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderNotificationWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        log.info("Admin WebSocket connecté ({}) — {} session(s)", session.getId(), sessions.size());
        send(session, AdminNotificationDto.builder()
                .type("CONNECTED")
                .title("Connecté")
                .message("Notifications WebSocket actives")
                .createdAt(LocalDateTime.now().toString())
                .build());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.info("Admin WebSocket déconnecté ({}) — {} session(s)", session.getId(), sessions.size());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        sessions.remove(session);
        log.warn("Erreur WebSocket {}: {}", session.getId(), exception.getMessage());
    }

    public void broadcast(AdminNotificationDto dto) {
        TextMessage message;
        try {
            message = new TextMessage(objectMapper.writeValueAsString(dto));
        } catch (IOException e) {
            log.error("Sérialisation notification impossible", e);
            return;
        }

        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) {
                sessions.remove(session);
                continue;
            }
            try {
                synchronized (session) {
                    session.sendMessage(message);
                }
            } catch (IOException e) {
                sessions.remove(session);
                try {
                    session.close();
                } catch (IOException ignored) {
                    // ignore
                }
            }
        }
        log.info("Notification NEW_ORDER diffusée à {} admin(s)", sessions.size());
    }

    private void send(WebSocketSession session, AdminNotificationDto dto) throws IOException {
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(dto)));
    }
}
