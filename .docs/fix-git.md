Cambiar el name del file entre mayuscula y minuscula hacer que no se vean los cambios de git
esta es la solucion a nivel de commandos git config core.ignorecase false, una vez eso el file queda como nuevo
y luego ya se puede hacer cambios bajo ese file
`git config core.ignorecase false`
https://stackoverflow.com/questions/11183788/in-a-git-repository-how-to-properly-rename-a-directory/11183844#comment109417158_11183844

Luego no funcionaba entonces abri el terminal en la carpeta /black y puse esto
git config core.ignorecase true
con eso se soluciono, luego no me quiso guardar el git me enviana un  error y luego hice en console de vscode `git config core.ignorecase false`
y se soluciono.