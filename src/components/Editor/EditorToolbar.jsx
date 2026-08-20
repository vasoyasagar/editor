import {
  UndoRedo,
  BoldItalicUnderlineToggles,
  StrikeThroughSupSubToggles,
  CodeToggle,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  InsertFrontmatter,
  Separator,
  DiffSourceToggleWrapper,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
} from '@mdxeditor/editor'
import AIDropdown from './AIDropdown'

function EditorToolbar() {
  return (
    <DiffSourceToggleWrapper>
      <ConditionalContents
        options={[
          {
            when: (editor) => editor?.editorType === 'codeblock',
            contents: () => <ChangeCodeMirrorLanguage />,
          },
          {
            fallback: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <StrikeThroughSupSubToggles />
                <Separator />
                <ListsToggle />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertThematicBreak />
                <InsertCodeBlock />
                <InsertFrontmatter />
                <Separator />
                <AIDropdown />
              </>
            ),
          },
        ]}
      />
    </DiffSourceToggleWrapper>
  )
}

export default EditorToolbar
