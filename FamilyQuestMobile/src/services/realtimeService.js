import * as signalR from '@microsoft/signalr';

import { API_BASE_URL } from '../config/api';

export function createChatConnection(token) {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/chat`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}
