const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const statusText = document.getElementById('status');
const previewContainer = document.getElementById('preview-container');
const photoPreview = document.getElementById('photo-preview');
const retryBtn = document.getElementById('retry-btn');

let stream = null;

async function startCamera() {
  statusText.textContent = "Kameraga ruxsat so'ralmoqda...";
  statusText.className = "status";
  previewContainer.style.display = "none";
  video.style.display = "block";
  retryBtn.style.display = "none";

  try {
    // Kameraga ruxsat so'rash
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    });

    video.srcObject = stream;

    statusText.textContent = "Kamera ulandi! 1 soniyada rasmga olinadi...";

    // Kamera kadrlari tayyor bo'lishini kutish
    video.onloadedmetadata = () => {
      setTimeout(() => {
        takeSnapshotAndSave();
      }, 1000);
    };

  } catch (err) {
    console.error("Kamera xatosi:", err);
    statusText.className = "status error";
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      statusText.textContent = "Kameraga ruxsat berilmadi. Iltimos, brauzerda ruxsat bering!";
    } else {
      statusText.textContent = "Kamerani ishga tushirib bo'lmadi: " + err.message;
    }
  }
}

async function takeSnapshotAndSave() {
  statusText.textContent = "Rasm olinmoqda va saqlanmoqda...";

  // Canvas o'lchamlarini videoga moslashtirish
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Rasm ma'lumotini Base64 ko'rinishida olish
  const imageData = canvas.toDataURL('image/png');

  // Preview qilib ko'rsatish
  photoPreview.src = imageData;
  previewContainer.style.display = "block";
  video.style.display = "none";

  // Kamerani to'xtatish
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  // Serverga yuborib /rasm jildiga saqlash
  try {
    const res = await fetch('/save-photo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: imageData })
    });

    if (res.ok) {
      const data = await res.json();
      statusText.className = "status success";
      statusText.textContent = `Rasm saqlandi: rasm/${data.filename}`;
    } else {
      throw new Error("Server xatosi");
    }
  } catch (error) {
    console.warn("Serverga yuborishda xatolik, lokal yuklab olish taklif etiladi:", error);
    statusText.className = "status success";
    statusText.textContent = "Rasm olindi va saqlandi (yuklab olindi)!";

    // Agar server ishlamayotgan bo'lsa (masalan oddiy fayl sifatida ochilgan bo'lsa), avtomatik yuklab beradi
    const downloadLink = document.createElement('a');
    downloadLink.href = imageData;
    downloadLink.download = `rasm_${Date.now()}.png`;
    downloadLink.click();
  }

  retryBtn.style.display = "inline-block";
}

retryBtn.addEventListener('click', () => {
  startCamera();
});

// Sahifa yuklanishi bilanoq kamerani boshlash
window.addEventListener('DOMContentLoaded', () => {
  startCamera();
});
