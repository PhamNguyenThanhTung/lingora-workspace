package com.pnttung.lingora.ui.foundation;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import com.pnttung.lingora.LingoraApp;
import com.pnttung.lingora.R;
import com.pnttung.lingora.databinding.FragmentFoundationStatusBinding;
import com.pnttung.lingora.domain.model.AuthSession;

public class FoundationStatusFragment extends Fragment {

    private FragmentFoundationStatusBinding binding;
    private FoundationStatusViewModel viewModel;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentFoundationStatusBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        LingoraApp app = (LingoraApp) requireActivity().getApplication();
        viewModel = new FoundationStatusViewModel(app.getAuthRepository(), app.getAiConnectivityRepository());

        AuthSession session = viewModel.getCurrentSession();
        if (session != null && session.getEmail() != null) {
            binding.tvUserEmail.setText(getString(R.string.status_logged_in_as, session.getEmail()));
        }

        binding.btnHealthCheck.setOnClickListener(v -> viewModel.testHealth());
        binding.btnSrsCheck.setOnClickListener(v -> viewModel.testSrsInference());
        binding.btnChatCheck.setOnClickListener(v -> viewModel.testChatRoleplay());
        binding.btnLogout.setOnClickListener(v -> viewModel.logout());

        viewModel.getUiState().observe(getViewLifecycleOwner(), state -> {
            if (state == null) return;

            binding.progressBar.setVisibility(state.isLoading ? View.VISIBLE : View.GONE);
            binding.btnHealthCheck.setEnabled(!state.isLoading);
            binding.btnSrsCheck.setEnabled(!state.isLoading);
            binding.btnChatCheck.setEnabled(!state.isLoading);
            binding.btnLogout.setEnabled(!state.isLoading);

            if (state.outputText != null) {
                binding.tvResultOutput.setText(state.outputText);
            }

            if (state.isLoggedOut) {
                Navigation.findNavController(view).navigate(R.id.action_foundationStatus_to_login);
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
