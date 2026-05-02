require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} = require('discord.js');

const config = require('./config.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`Logado como ${client.user.tag}`);

  const canal = await client.channels.fetch(config.canalRegistro);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('registro')
      .setLabel('Fazer Registro')
      .setStyle(ButtonStyle.Primary)
  );

  canal.send({
    embeds: [
      new EmbedBuilder()
        .setTitle('📋 Sistema de Registro')
        .setDescription('Clique no botão abaixo para se registrar.')
        .setColor('Blue')
    ],
    components: [row]
  });
});

client.on('interactionCreate', async (interaction) => {

  if (interaction.isButton() && interaction.customId === 'registro') {

    const modal = new ModalBuilder()
      .setCustomId('formRegistro')
      .setTitle('Registro');

    const nome = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Seu nome')
      .setStyle(TextInputStyle.Short);

    const id = new TextInputBuilder()
      .setCustomId('id')
      .setLabel('Seu ID')
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nome),
      new ActionRowBuilder().addComponents(id)
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'formRegistro') {

    const nome = interaction.fields.getTextInputValue('nome');
    const id = interaction.fields.getTextInputValue('id');

    const canal = await client.channels.fetch(config.canalAprovacao);

    const embed = new EmbedBuilder()
      .setTitle('📥 Novo Registro')
      .addFields(
        { name: 'Usuário', value: `<@${interaction.user.id}>` },
        { name: 'Nome', value: nome },
        { name: 'ID', value: id }
      )
      .setColor('Green');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aprovar_${interaction.user.id}`)
        .setLabel('Aprovar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`recusar_${interaction.user.id}`)
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
    );

    await canal.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: '✅ Registro enviado para aprovação.',
      ephemeral: true
    });
  }

  if (interaction.isButton()) {

    if (interaction.customId.startsWith('aprovar_')) {

      const userId = interaction.customId.split('_')[1];

      const membro = await interaction.guild.members.fetch(userId);
      const cargo = interaction.guild.roles.cache.get(config.cargoMembro);

      await membro.roles.add(cargo);

      return interaction.update({
        content: `✅ Aprovado: <@${userId}>`,
        components: [],
        embeds: []
      });
    }

    if (interaction.customId.startsWith('recusar_')) {

      const userId = interaction.customId.split('_')[1];

      return interaction.update({
        content: `❌ Recusado: <@${userId}>`,
        components: [],
        embeds: []
      });
    }
  }
});

client.login(process.env.TOKEN);