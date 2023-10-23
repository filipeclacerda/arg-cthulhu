# Use a imagem Node.js como base
FROM node:18

# Defina o diretório de trabalho no contêiner
WORKDIR /app

# Copie o package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie todos os arquivos do aplicativo para o contêiner
COPY . .

# Compile o aplicativo (se necessário)
RUN npm run build

# Exponha a porta em que o aplicativo Next.js será executado
EXPOSE 3000

# Comando para iniciar o aplicativo
CMD ["npm", "start"]
