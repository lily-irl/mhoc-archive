const textArea = document.getElementById('text')

function render(e) {
    textArea.innerHTML = DOMPurify.sanitize(marked.parse(textArea.innerText))
}

window.onload = render
