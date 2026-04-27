with open('src/pages/QuestionAdmin.js', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if i >= len(lines) - 10 and line.rstrip() == '      )}':
        lines = lines[:i]
        break

lines.append('\n')
lines.append('      {/* -- TAB: SECCIONES -- */}\n')
lines.append('      {!loading and activeTab == \"sections\" and (\n')
lines.append('        <div className=\"space-y-5\">\n')
lines.append('          <SectionList />\n')
lines.append('        </div>\n')
lines.append('      )}\n')
lines.append('\n')
lines.append('      {/* -- TAB: CONFIG. MODULOS -- */}\n')
lines.append('      {!loading and activeTab == \"moduleConfig\" and (\n')
lines.append('        <div className=\"space-y-5\">\n')
lines.append('          <ModuleConfig />\n')
lines.append('        </div>\n')
lines.append('      )}\n')
lines.append('    </div>\n')
lines.append('  );\n')
lines.append('}\n')

with open('src/pages/QuestionAdmin.js', 'w') as f:
    f.writelines(lines)

print('Updated successfully')