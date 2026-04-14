import { Days } from '../interfaces/interfaces'
import { createURL } from './create-url-link'
// Passar uma lita de strings
// Para cada string, eu crio um objeto {title, url}
// Qual entidade pertence a string????

function createLink(title: string, entity: string, split: boolean = false) {
  const url = split ? title.split(' - ', 1)[0] : title
  return {
    title,
    url: `/docs/${entity}/${createURL(url)}`,
  }
}

export function createLinkToEachClass(props: {
  weekClasses: Days[]
  title: string
}) {
  return props.weekClasses.map((week) => {
    return {
      ...week,
      dayClasses: week.dayClasses.map((el) => {
        el.links = []
        ;(el.teachers ?? []).forEach((teacher) => {
          if (props.title !== teacher) {
            el.links.push(createLink(teacher, 'professor'))
          }
        })
        if (el.classroom && el.classroom !== 'Indefinido' && props.title !== el.classroom) {
          el.links.push(createLink(el.classroom, 'sala'))
        }
        ;(el.students ?? []).forEach((student) => {
          if (props.title !== student) {
            el.links.push(createLink(student, 'turma'))
          }
        })
        return el
      }),
    }
  })
}
