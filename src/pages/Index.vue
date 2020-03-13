<template>
  <q-page class="q-pa-md">
    <div class="row q-pa-md">
      <div class="col"></div>
      <div class="col-7">
        <q-input v-model="encrypted_text" label="Encrypted Message" outlined type="textarea" />
      </div>
      <div class="col"></div>
    </div>

    <div class="row q-pa-md">
      <div class="col"></div>
      <div class="col-7">
        <q-input v-model="private_key_text" label="Private Key" outlined type="textarea" />
      </div>
      <div class="col"></div>
    </div>

    <div class="row q-pa-md">
      <div class="col"></div>
      <div class="col-7">{{decrypted_text}}</div>
      <div class="col">
        <q-btn color="primary" label="Decrypt" @click="decrypt_message" />
      </div>
    </div>
  </q-page>
</template>

<script>
const crypto = require("crypto");
export default {
  data() {
    return {
      encrypted_text: "",
      private_key_text: "",
      decrypted_text: "None Yet"
    };
  },
  methods: {
    decrypt_message() {
      if (this.encrypted_text == "") {
        this.decrypted_text = "Please enter an encrypted message";
        return;
      }

      if (this.private_key_text == "") {
        this.decrypted_text = "Please enter your private key";
        return;
      }

      const buf = Buffer.from(this.encrypted_text, "base64");

      var password = crypto.privateDecrypt(
        {
          key: this.private_key_text.toString(),
          passphrase: "",
          padding: crypto.constants.RSA_PKCS1_PADDING
        },
        buf
      );
      this.decrypted_text = password.toString("utf8");
    }
  }
};
</script>
