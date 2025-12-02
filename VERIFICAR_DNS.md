# 🔍 Verificar DNS e Configuração

## Passo 1: Verificar se DNS está propagado

No servidor, execute:

```bash
nslookup marcohama.com
# ou
dig marcohama.com
```

Deve retornar: `72.60.20.31`

## Passo 2: Verificar se domínio está acessível

```bash
curl -I http://marcohama.com
curl -I http://www.marcohama.com
```

## Passo 3: Verificar configuração do Nginx

```bash
cat /etc/nginx/sites-available/maktubia
```

Deve ter:
```nginx
server_name marcohama.com www.marcohama.com;
```

## Passo 4: Verificar se porta 80 está aberta

```bash
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

## Passo 5: Testar acesso direto

```bash
curl http://marcohama.com
```

Se retornar HTML, está funcionando. Se retornar erro, o DNS não está propagado ainda.






