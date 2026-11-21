/** Galeri sayfası: fotoğrafı büyüten, klavye ve kaydırma destekli görüntüleyici. */
document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.getElementById("lightbox");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const items = [...document.querySelectorAll(".gallery-item")];
  const image = dialog.querySelector(".lightbox-img");
  const caption = dialog.querySelector(".lightbox-caption");
  let index = 0;
  let touchStartX = null;

  function show(next) {
    index = (next + items.length) % items.length;
    const thumb = items[index].querySelector("img");
    image.src = items[index].dataset.full;
    image.alt = thumb.alt;
    caption.textContent = `${thumb.alt} (${index + 1}/${items.length})`;
  }

  items.forEach((button, i) => {
    button.addEventListener("click", () => {
      show(i);
      dialog.showModal();
    });
  });

  dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".lightbox-prev").addEventListener("click", () => show(index - 1));
  dialog.querySelector(".lightbox-next").addEventListener("click", () => show(index + 1));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });
  dialog.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  dialog.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) > 50) show(index + (delta < 0 ? 1 : -1));
  });
});
