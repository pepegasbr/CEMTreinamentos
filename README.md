# Central de Treinamentos CEM

## Como editar os treinamentos

Os Google Docs continuam sendo a fonte principal. Basta editar o documento correspondente; o site busca a versão nova automaticamente e mantém o conteúdo em cache por no máximo 10 minutos.

- [Verdadeiro ou Falso](https://docs.google.com/document/d/13mufkEtYY8eDHxu_szmMKM_TmAbEV4pr29GStEn80qk/edit)
- [Treinamento Documental](https://docs.google.com/document/d/1h0MtzZj31NagmyZLIJGftwpOBYOHGh4AUUKSjDbEnC4/edit)
- [Avaliação / Resolução](https://docs.google.com/document/d/14UkNVic1wHGQ5gKNwjKG4Tgbzb3eHYKdMGDWO1N6OMM/edit)
- [Pulso Firme & Rigidez](https://docs.google.com/document/d/1cRty-m9_PqGlYCX1XaQhNoOXluwF746o1z57FhrHjPQ/edit)
- [Treinamento de Fardas](https://docs.google.com/document/d/17rV3wx5qpl5AmB6rFeqXkPQdNxopnoZXlzI8dDjTC4U/edit)

Mantenha as perguntas neste formato:

```text
1. Texto da pergunta
R: Texto da resposta
```

No documento de Verdadeiro ou Falso, a resposta deve começar com `Verdadeiro` ou `Falso`. No TDP, mantenha os títulos `[AV1]`, `[AV2]` etc. Em Avaliação / Resolução, mantenha `[AVDOC]` e `[RES]`.

O carregamento possui três níveis automáticos:

1. versão atual do Google Docs;
2. última versão válida salva no dispositivo;
3. cópia de segurança servida junto com o próprio site.

As cópias de segurança são atualizadas automaticamente durante o build. Para atualizá-las manualmente:

```bash
npm run sync:trainings
```

Para apenas conferir se todos os documentos continuam acessíveis e no formato correto:

```bash
npm run check:trainings
```

## Desenvolvimento

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```
