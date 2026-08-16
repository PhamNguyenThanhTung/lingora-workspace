package com.pnttung.lingora.data.repository;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.SharedPreferences;
import com.pnttung.lingora.data.remote.SupabaseAuthService;
import com.pnttung.lingora.domain.model.AuthSession;
import com.pnttung.lingora.util.SessionStore;
import java.io.IOException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import okhttp3.OkHttpClient;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class AuthRepositoryTest {

    private MockWebServer server;
    private AuthRepository authRepository;
    private SessionStore sessionStore;

    @Before
    public void setUp() throws IOException {
        server = new MockWebServer();
        server.start();

        SharedPreferences mockPrefs = Mockito.mock(SharedPreferences.class);
        SharedPreferences.Editor mockEditor = Mockito.mock(SharedPreferences.Editor.class);
        Mockito.when(mockPrefs.edit()).thenReturn(mockEditor);
        Mockito.when(mockEditor.putString(Mockito.anyString(), Mockito.anyString())).thenReturn(mockEditor);
        Mockito.when(mockEditor.putLong(Mockito.anyString(), Mockito.anyLong())).thenReturn(mockEditor);
        Mockito.when(mockEditor.clear()).thenReturn(mockEditor);

        sessionStore = new SessionStore(mockPrefs);

        SupabaseAuthService service = new Retrofit.Builder()
                .baseUrl(server.url("/"))
                .client(new OkHttpClient())
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(SupabaseAuthService.class);

        authRepository = new AuthRepository(service, sessionStore);
    }

    @After
    public void tearDown() throws IOException {
        server.shutdown();
    }

    @Test
    public void testLoginSuccess() throws InterruptedException {
        String json = "{\n" +
                "  \"access_token\": \"fake-access-token\",\n" +
                "  \"token_type\": \"bearer\",\n" +
                "  \"expires_in\": 3600,\n" +
                "  \"refresh_token\": \"fake-refresh-token\",\n" +
                "  \"user\": {\n" +
                "    \"id\": \"user-uuid-123\",\n" +
                "    \"email\": \"learner@lingora.test\",\n" +
                "    \"role\": \"authenticated\"\n" +
                "  }\n" +
                "}";

        server.enqueue(new MockResponse().setResponseCode(200).setBody(json));

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<AuthSession> sessionRef = new AtomicReference<>();

        authRepository.login("learner@lingora.test", "password123", new AuthRepository.AuthCallback() {
            @Override
            public void onSuccess(AuthSession session) {
                sessionRef.set(session);
                latch.countDown();
            }

            @Override
            public void onError(String code, String message) {
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        assertNotNull(sessionRef.get());
        assertEquals("fake-access-token", sessionRef.get().getAccessToken());
        assertEquals("learner@lingora.test", sessionRef.get().getEmail());
    }

    @Test
    public void testLoginErrorHandling() throws InterruptedException {
        String errorJson = "{\"error\": {\"code\": \"INVALID_CREDENTIALS\", \"message\": \"Invalid login credentials\"}}";
        server.enqueue(new MockResponse().setResponseCode(400).setBody(errorJson));

        CountDownLatch latch = new CountDownLatch(1);
        AtomicBoolean errorCalled = new AtomicBoolean(false);

        authRepository.login("learner@lingora.test", "wrongpass", new AuthRepository.AuthCallback() {
            @Override
            public void onSuccess(AuthSession session) {
                latch.countDown();
            }

            @Override
            public void onError(String code, String message) {
                errorCalled.set(true);
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        assertTrue(errorCalled.get());
    }
}
