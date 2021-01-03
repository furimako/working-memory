const app = new Vue({
    delimiters: ['${', '}'],
    el: '#app',
    data: {
        title: 'Minimal Notes',
        note: {
            text: '',
            date: ''
        },
        notes: [{
            text: 'Minimal Notes',
            date: new Date(Date.now()).toLocaleString()
        }]
    },
    methods: {
        addNote() {
            const {
                text, title, color
            } = this.note
            this.notes.push({
                text,
                date: new Date(Date.now()).toLocaleString()
            })
            this.note.text = ''
            console.log(`addNote (text: ${text}, title: ${title}, color: ${color})`)
            console.log(`addNote (this.note: ${JSON.stringify(this.note)})`)
            console.log(`addNote (this.notes: ${JSON.stringify(this.notes)})`)
        },
        removeNote(index) {
            this.$delete(this.notes, index)
        }
    },
    mounted() {
        if (localStorage.getItem('notes')) {
            this.notes = JSON.parse(localStorage.getItem('notes'))
            console.log(`mounted (this.notes: ${JSON.stringify(this.notes)})`)
        }
    },
    watch: {
        notes: {
            handler() {
                localStorage.setItem('notes', JSON.stringify(this.notes))
                console.log(`handler (this.notes: ${JSON.stringify(this.notes)})`)
            },
            deep: true
        }
    }
})
