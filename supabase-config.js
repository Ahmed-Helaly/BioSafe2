// 1. دالة تفعيل وحفظ الدخول بالبصمة (بعد ما يسجل بالباسورد أول مرة)
async function registerBiometricLogin(userEmail, userId) {
    // التحقق إن الجهاز بيدعم البصمة
    if (!window.PublicKeyCredential) {
        alert("المتصفح أو الجهاز لا يدعم الدخول بالبصمة");
        return;
    }

    // بيانات التشفير العشوائية (Challenge)
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
            name: "BioSafe Medical System",
            id: window.location.hostname // لازم يكون شغال على HTTPS أو localhost
        },
        user: {
            id: Uint8Array.from(userId, c => c.charCodeAt(0)),
            name: userEmail,
            displayName: userEmail
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }], // خوارزمية ES256
        authenticatorSelection: {
            authenticatorAttachment: "platform", // يجبره يستخدم بصمة التليفون/اللابتوب نفسه مش فلاشة خارجية
            userVerification: "required" // يجبره يأكد بالبصمة أو الـ PIN بتاع الجهاز
        },
        timeout: 60000
    };

    try {
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });
        
        // نحفظ ID المفتاح في localStorage عشان نعرف إن الجهاز ده متفعل عليه البصمة
        localStorage.setItem("biosafe_cred_id", credential.id);
        alert("تم تفعيل الدخول بالبصمة بنجاح!");
    } catch (err) {
        console.error("فشل تفعيل البصمة:", err);
    }
}

// 2. دالة تسجيل الدخول السريع بالبصمة (زي تطبيقات البنوك)
async function loginWithBiometrics() {
    const savedCredId = localStorage.getItem("biosafe_cred_id");
    if (!savedCredId) {
        alert("البصمة غير مفعلة على هذا الجهاز، سجل بالباسورد أولاً.");
        return;
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyCredentialRequestOptions = {
        challenge: challenge,
        allowCredentials: [{
            id: Uint8Array.from(atob(savedCredId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
            type: 'public-key',
            transports: ['internal'] // البصمة الداخلية للجهاز
        }],
        userVerification: "required", // إجبار التحقق بالبصمة
        timeout: 60000
    };

    try {
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });

        if (assertion) {
            // هنا البصمة اتأكدت بنجاح! تقدر تدخله على طول أو تجيب بياناته من Supabase
            console.log("تم التحقق بنجاح!", assertion);
            window.location.href = "dashboard.html"; 
        }
    } catch (err) {
        console.error("تم إلغاء البصمة أو فشلت:", err);
    }
}