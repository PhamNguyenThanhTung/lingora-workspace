package com.pnttung.lingora.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import android.content.SharedPreferences;
import com.pnttung.lingora.domain.model.AuthSession;
import java.io.IOException;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

public class TokenAuthenticatorTest {

    private MockWebServer server;
    private SessionStore sessionStore;
    private TokenAuthenticator authenticator;
    private SharedPreferences mockPrefs;
    private SharedPreferences.Editor mockEditor;

    @Before
    public void setUp() throws IOException {
        server = new MockWebServer();
        server.start();

        mockPrefs = Mockito.mock(SharedPreferences.class);
        mockEditor = Mockito.mock(SharedPreferences.Editor.class);
        Mockito.when(mockPrefs.edit()).thenReturn(mockEditor);
        Mockito.when(mockEditor.putString(Mockito.anyString(), Mockito.anyString())).thenReturn(mockEditor);
        Mockito.when(mockEditor.putLong(Mockito.anyString(), Mockito.anyLong())).thenReturn(mockEditor);
        Mockito.when(mockEditor.clear()).thenReturn(mockEditor);

        sessionStore = new SessionStore(mockPrefs);

        authenticator = new TokenAuthenticator(
                sessionStore,
                server.url("/").toString(),
                "test-anon-key"
        );
    }

    @After
    public void tearDown() throws IOException {
        server.shutdown();
    }

    @Test
    public void testAuthenticateRefreshesTokenOn401() throws IOException {
        Mockito.when(mockPrefs.getString(Mockito.eq("refresh_token"), Mockito.any())).thenReturn("valid-refresh-token");
        Mockito.when(mockPrefs.getString(Mockito.eq("access_token"), Mockito.any())).thenReturn("expired-access-token");

        String refreshSuccessJson = "{\n" +
                "  \"access_token\": \"new-refreshed-token\",\n" +
                "  \"token_type\": \"bearer\",\n" +
                "  \"expires_in\": 3600,\n" +
                "  \"refresh_token\": \"new-refresh-token\",\n" +
                "  \"user\": {\"id\": \"user-1\", \"email\": \"user@lingora.test\"}\n" +
                "}";

        server.enqueue(new MockResponse().setResponseCode(200).setBody(refreshSuccessJson));

        Request initialRequest = new Request.Builder()
                .url(server.url("/api/protected"))
                .header("Authorization", "Bearer expired-access-token")
                .build();

        Response initialResponse = new Response.Builder()
                .request(initialRequest)
                .protocol(okhttp3.Protocol.HTTP_1_1)
                .code(401)
                .message("Unauthorized")
                .build();

        Request retryRequest = authenticator.authenticate(null, initialResponse);
        assertNotNull(retryRequest);
        assertEquals("Bearer new-refreshed-token", retryRequest.header("Authorization"));
        assertEquals("1", retryRequest.header("X-Lingora-Retry-Count"));
    }

    @Test
    public void testPreventInfiniteRetryLoop() throws IOException {
        Request retriedRequest = new Request.Builder()
                .url(server.url("/api/protected"))
                .header("Authorization", "Bearer expired-access-token")
                .header("X-Lingora-Retry-Count", "1")
                .build();

        Response second401Response = new Response.Builder()
                .request(retriedRequest)
                .protocol(okhttp3.Protocol.HTTP_1_1)
                .code(401)
                .message("Unauthorized")
                .build();

        Request nextRetry = authenticator.authenticate(null, second401Response);
        assertNull(nextRetry);
    }
}
