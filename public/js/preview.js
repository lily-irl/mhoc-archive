const textArea = document.getElementById('bill-text')
const previewArea = document.getElementById('preview')

function render(e) {
    previewArea.innerHTML = DOMPurify.sanitize(marked.parse(textArea.value))
}

textArea.oninput = render
window.onload = render
