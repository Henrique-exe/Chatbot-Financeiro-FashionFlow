const msgs = document.getElementById('messages');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('send-btn');
  let encerrado = false;
  let aguardandoResposta = null;
  let fluxoAtual = null;

  const intencoes = [
    {
      tag: 'saudacao',
      palavras: ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'como vai', 'e ai', 'hey', 'hello', 'hi', 'salve', 'oie'],
      resposta: 'Olá! Seja bem-vindo ao atendimento financeiro da FashionFlow 👋 Como posso te ajudar hoje?',
      chips: ['Formas de pagamento', 'Parcelamento', 'Pagar com Pix', 'Pagar no crédito', 'Reembolso', 'Débito em conta']
    },
    {
      tag: 'formas_pagamento',
      palavras: ['formas de pagamento', 'como pagar', 'aceita cartão', 'aceita pix', 'métodos de pagamento', 'formas de pagar', 'quais pagamentos'],
      resposta: 'Aceitamos as seguintes formas de pagamento:',
      especial: 'pagamentos_lista',
      chips: ['Pagar com Pix', 'Pagar no crédito', 'Parcelamento', 'Pagamento misto']
    },
    {
      tag: 'pix',
      palavras: ['pix', 'pagar com pix', 'pagar no pix', 'chave pix', 'qr code pix', 'pagamento pix'],
      resposta: 'Ótimo! O Pix tem aprovação imediata. Aqui está nossa chave Pix para pagamento:',
      especial: 'chave_pix',
      chips: ['Fazer outro pagamento', 'Consultar meu pedido', 'Encerrar atendimento'],
      fluxo_fim: true
    },
    {
      tag: 'credito',
      palavras: ['crédito', 'credito', 'cartão de crédito', 'pagar no crédito', 'pagar com crédito', 'cartao de credito'],
      resposta: 'Pagamento no crédito disponível em até 12x sem juros! Para prosseguir, acesse o link de checkout seguro:',
      especial: 'link_credito',
      chips: ['Parcelamento', 'Pagamento misto', 'Encerrar atendimento'],
      fluxo_fim: true
    },
    {
      tag: 'debito',
      palavras: ['débito', 'debito', 'cartão de débito', 'pagar no débito', 'pagar com débito', 'debito em conta', 'débito em conta', 'cartao de debito'],
      resposta: 'Pagamento no débito disponível! Redirecionarei você para o ambiente seguro de pagamento:',
      especial: 'link_debito',
      chips: ['Pagar com Pix', 'Pagar no crédito', 'Encerrar atendimento'],
      fluxo_fim: true
    },
    {
      tag: 'parcelamento',
      palavras: ['parcelar', 'parcelas', 'parcelamento', 'sem juros', 'dividir', 'quantas parcelas', 'posso parcelar', '12x', '6x', '3x'],
      resposta: 'Você pode parcelar em até 12x sem juros no cartão de crédito. Veja as condições:',
      especial: 'tabela_parcelas',
      chips: ['Pagar no crédito', 'Pagamento misto', 'Encerrar atendimento']
    },
    {
      tag: 'pagamento_misto',
      palavras: ['pagamento misto', 'pix e crédito', 'dividir pagamento', 'metade pix', 'pix e credito', 'dois cartões', 'cartão e pix'],
      resposta: 'Sim! Você pode combinar Pix + cartão de crédito no mesmo pedido. Acesse o checkout:',
      especial: 'link_misto',
      chips: ['Parcelamento', 'Encerrar atendimento'],
      fluxo_fim: true
    },
    {
      tag: 'reembolso',
      palavras: ['reembolso', 'estorno', 'devolução do dinheiro', 'quero meu dinheiro de volta', 'ressarcimento', 'devolver dinheiro', 'receber meu dinheiro'],
      resposta: 'Para solicitar reembolso, preciso de alguns dados:',
      especial: 'form_reembolso',
      chips: ['Encerrar atendimento']
    },
    {
      tag: 'desconto',
      palavras: ['cupom', 'desconto', 'voucher', 'promoção', 'codigo promocional', 'cupom de desconto', 'tem desconto', 'black friday'],
      resposta: 'Você pode aplicar seu cupom na etapa de revisão do pedido, antes de finalizar o pagamento.',
      chips: ['Pagar com Pix', 'Pagar no crédito', 'Encerrar atendimento']
    },
    {
      tag: 'consultar_pedido',
      palavras: ['status do pedido', 'meu pedido', 'acompanhar pedido', 'rastrear', 'rastreamento', 'onde está meu pedido', 'previsão de entrega', 'codigo de rastreio'],
      resposta: 'Para consultar seu pedido, acesse nossa área do cliente com o número do pedido e e-mail cadastrado:',
      especial: 'link_pedido',
      chips: ['Reembolso', 'Encerrar atendimento']
    },
    {
      tag: 'exit',
      palavras: ['sair', 'encerrar', 'finalizar', 'fechar', 'tchau', 'bye', 'adeus', 'até mais', 'até logo', 'valeu', 'vlw', 'flw', 'obrigado', 'obrigada', 'falou'],
      resposta: 'Foi um prazer te atender! Se precisar de algo mais, estamos à disposição. Até logo! 👋',
      encerrar: true
    }
  ];

  function normalizar(txt) {
    return txt.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ').trim();
  }

  function buscar(msg) {
    const norm = normalizar(msg);
    let melhor = null, maxPeso = 0;
    for (const i of intencoes) {
      let peso = 0;
      for (const p of i.palavras) {
        if (norm.includes(normalizar(p))) peso++;
      }
      if (peso > maxPeso) { maxPeso = peso; melhor = i; }
    }
    return melhor;
  }

  function especialHTML(tipo) {
    if (tipo === 'chave_pix') {
      return `<div class="special-card">
      <div class="card-title"><i class="ti ti-brand-paypal" aria-hidden="true"></i> Chave Pix</div>
      <div class="pix-key"><span>fashionflow</span>@pagamentos.com.br</div>
      <div style="font-size:11px;color:var(--color-text-secondary);margin-top:6px;">Tipo: e-mail · Favorecido: FashionFlow Ltda · CNPJ: 00.000.000/0001-00</div>
      <button class="copy-btn" onclick="navigator.clipboard&&navigator.clipboard.writeText('fashionflow@pagamentos.com.br');this.textContent='✓ Copiado!'"><i class="ti ti-copy"></i> Copiar chave</button>
      <div style="margin-top:8px;font-size:11px;color:var(--color-text-secondary);">Após o pagamento, envie o comprovante pelo chat.</div>
    </div>`;
    }
    if (tipo === 'link_credito') {
      return `<div class="special-card">
      <div class="card-title"><i class="ti ti-credit-card" aria-hidden="true"></i> Checkout seguro — crédito</div>
      <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:8px;">Ambiente criptografado. Bandeiras aceitas: Visa, Master, Elo, Amex, Hipercard.</div>
      <a class="link-btn" href="https://checkout.fashionflow.com.br/credito" target="_blank"><i class="ti ti-external-link"></i> Acessar checkout</a>
      <div style="margin-top:6px;font-size:11px;color:var(--color-text-secondary);">Sessão expira em 15 minutos.</div>
    </div>`;
    }
    if (tipo === 'link_debito') {
      return `<div class="special-card">
      <div class="card-title"><i class="ti ti-credit-card" aria-hidden="true"></i> Checkout seguro — débito</div>
      <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:8px;">Débito disponível para Visa Electron, Maestro e Elo Débito.</div>
      <a class="link-btn" href="https://checkout.fashionflow.com.br/debito" target="_blank"><i class="ti ti-external-link"></i> Acessar checkout</a>
    </div>`;
    }
    if (tipo === 'link_misto') {
      return `<div class="special-card">
      <div class="card-title"><i class="ti ti-arrows-exchange" aria-hidden="true"></i> Pagamento combinado</div>
      <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:8px;">Escolha o valor no Pix e o restante no crédito diretamente no checkout.</div>
      <a class="link-btn" href="https://checkout.fashionflow.com.br/misto" target="_blank"><i class="ti ti-external-link"></i> Acessar checkout misto</a>
    </div>`;
    }
    if (tipo === 'link_pedido') {
      return `<div class="special-card">
      <div class="card-title"><i class="ti ti-package" aria-hidden="true"></i> Área do cliente</div>
      <a class="link-btn" href="https://app.fashionflow.com.br/meus-pedidos" target="_blank"><i class="ti ti-external-link"></i> Ver meus pedidos</a>
    </div>`;
    }
    if (tipo === 'tabela_parcelas') {
      const dados = [[1, 'Sem juros'], [2, 'Sem juros'], [3, 'Sem juros'], [6, 'Sem juros'], [9, '0,99% a.m.'], [12, 'Sem juros (cartão parceiro)']];
      const linhas = dados.map(([p, j]) => `<tr><td style="padding:5px 8px;font-size:12px;">${p}x</td><td style="padding:5px 8px;font-size:12px;color:var(--color-text-secondary);">${j}</td></tr>`).join('');
      return `<div class="special-card"><div class="card-title"><i class="ti ti-list" aria-hidden="true"></i> Tabela de parcelamento</div><table style="width:100%;border-collapse:collapse">${linhas}</table></div>`;
    }
    if (tipo === 'pagamentos_lista') {
      const itens = [['ti-brand-paypal', 'Pix', 'Aprovação imediata'], ['ti-credit-card', 'Crédito', 'Até 12x sem juros'], ['ti-credit-card', 'Débito', 'Principais bandeiras'], ['ti-arrows-exchange', 'Pix + Crédito', 'Pagamento misto']];
      const cards = itens.map(([ic, nome, desc]) => `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:0.5px solid var(--color-border-tertiary);"><i class="ti ${ic}" style="font-size:18px;color:#4f8ef7" aria-hidden="true"></i><div><div style="font-size:13px;font-weight:500;">${nome}</div><div style="font-size:11px;color:var(--color-text-secondary);">${desc}</div></div></div>`).join('');
      return `<div class="special-card"><div class="card-title">Métodos disponíveis</div>${cards}</div>`;
    }
    if (tipo === 'form_reembolso') {
      return `<div class="special-card">
      <div class="card-title"><i class="ti ti-receipt-refund" aria-hidden="true"></i> Solicitação de reembolso</div>
      <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:8px;">Prazo: até 24h (Pix) ou 48h úteis (cartão).</div>
      <a class="link-btn" href="https://suporte.fashionflow.com.br/reembolso" target="_blank"><i class="ti ti-external-link"></i> Abrir formulário de reembolso</a>
      <div style="margin-top:6px;font-size:11px;color:var(--color-text-secondary);">Tenha em mãos: número do pedido e e-mail cadastrado.</div>
    </div>`;
    }
    return '';
  }

  function addMsg(quem, texto, especial, chips, encerrar) {
    const wrap = document.createElement('div');
    wrap.className = `msg ${quem}`;
    const sender = document.createElement('div');
    sender.className = 'sender';
    sender.textContent = quem === 'bot' ? 'FashionFlow Financeiro' : 'Você';
    const bub = document.createElement('div');
    bub.className = 'bubble';
    bub.textContent = texto;
    wrap.appendChild(sender);
    wrap.appendChild(bub);
    if (especial) {
      const el = document.createElement('div');
      el.innerHTML = especialHTML(especial);
      wrap.appendChild(el);
    }
    if (chips && chips.length) {
      const chipWrap = document.createElement('div');
      chipWrap.className = 'chips';
      chips.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'chip';
        btn.textContent = c;
        btn.onclick = () => { if (!encerrado) enviar(c); };
        chipWrap.appendChild(btn);
      });
      wrap.appendChild(chipWrap);
    }
    msgs.appendChild(wrap);
    if (encerrar) {
      const enc = document.createElement('div');
      enc.className = 'encerrado';
      enc.textContent = '— Atendimento encerrado —';
      msgs.appendChild(enc);
      encerrado = true;
      input.disabled = true;
      input.placeholder = 'Atendimento encerrado';
      sendBtn.disabled = true;
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function typing() {
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    wrap.id = 'typing-indicator';
    const bub = document.createElement('div');
    bub.className = 'bubble typing';
    bub.innerHTML = '<span></span><span></span><span></span>';
    wrap.appendChild(bub);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function enviar(texto) {
    if (!texto.trim() || encerrado) return;
    addMsg('user', texto);
    input.value = '';
    typing();
    const resultado = buscar(texto) || { resposta: 'Desculpe, não entendi. Pode tentar de outra forma? Ou escolha uma opção abaixo.', chips: ['Formas de pagamento', 'Pagar com Pix', 'Pagar no crédito', 'Reembolso', 'Encerrar atendimento'] };
    setTimeout(() => {
      removeTyping();
      addMsg('bot', resultado.resposta, resultado.especial, resultado.chips, resultado.encerrar);
    }, 700 + Math.random() * 400);
  }

  sendBtn.onclick = () => enviar(input.value);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') enviar(input.value); });

  setTimeout(() => {
    addMsg('bot', 'Olá! Seja bem-vindo ao atendimento financeiro da FashionFlow 👋 Como posso te ajudar hoje?', null,
      ['Formas de pagamento', 'Pagar com Pix', 'Pagar no crédito', 'Parcelamento', 'Reembolso', 'Débito em conta']);
  }, 300);