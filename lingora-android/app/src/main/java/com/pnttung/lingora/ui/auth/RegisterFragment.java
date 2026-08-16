package com.pnttung.lingora.ui.auth;

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
import com.pnttung.lingora.databinding.FragmentRegisterBinding;

public class RegisterFragment extends Fragment {

    private FragmentRegisterBinding binding;
    private AuthViewModel viewModel;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentRegisterBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        LingoraApp app = (LingoraApp) requireActivity().getApplication();
        viewModel = new AuthViewModel(app.getAuthRepository());

        binding.btnRegister.setOnClickListener(v -> {
            String email = binding.etEmail.getText() != null ? binding.etEmail.getText().toString() : "";
            String password = binding.etPassword.getText() != null ? binding.etPassword.getText().toString() : "";
            viewModel.register(email, password);
        });

        binding.btnToLogin.setOnClickListener(v -> {
            Navigation.findNavController(v).navigate(R.id.action_register_to_login);
        });

        viewModel.getAuthState().observe(getViewLifecycleOwner(), state -> {
            if (state == null) return;

            binding.progressBar.setVisibility(state.isLoading ? View.VISIBLE : View.GONE);
            binding.btnRegister.setEnabled(!state.isLoading);
            binding.btnToLogin.setEnabled(!state.isLoading);

            if (state.errorMessage != null && !state.errorMessage.isEmpty()) {
                binding.tvError.setVisibility(View.VISIBLE);
                binding.tvError.setText(state.errorMessage);
            } else {
                binding.tvError.setVisibility(View.GONE);
            }

            if (state.isSuccess && state.session != null) {
                Navigation.findNavController(view).navigate(R.id.action_register_to_foundationStatus);
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
