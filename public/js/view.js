const textArea = document.getElementById('text')

function render(e) {
    previewArea.innerHTML = DOMPurify.sanitize(marked.parse(textArea.innerText))
}

window.onload = render
