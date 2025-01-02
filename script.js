function openModal(episode) {
    document.getElementById(episode).classList.add('open');
}

function closeModal(episode) {
    const modal = document.getElementById(episode);
    modal.style.animation = "fadeOutModal 0.5s forwards";
    setTimeout(() => {
        modal.classList.remove('open');
        modal.style.animation = "";
    }, 500);
}
