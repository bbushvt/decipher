<template>
  <q-page class="q-pa-md">
    <div class="row q-ptx-md">
      <div class="col"></div>
      <div class="col-7">
        <div class="q-pa-md q-gutter-sm">
          <q-btn
            no-caps
            size="sm"
            color="primary"
            label="Load Message from File"
            @click="load_message_from_file"
          />
        </div>
      </div>
      <div class="col"></div>
    </div>

    <div class="row q-pa-md">
      <div class="col"></div>
      <div class="col-7">
        <q-input v-model="encrypted_text" label="Encrypted Message" outlined type="textarea" />
      </div>
      <div class="col"></div>
    </div>

    <div class="row q-pbx-md">
      <div class="col"></div>
      <div class="col-7">
        <div class="q-pa-md q-gutter-sm">
          <q-btn
            no-caps
            size="sm"
            color="primary"
            label="Load Private Key from File"
            @click="load_private_key_from_file"
          />
          <q-btn
            no-caps
            size="sm"
            color="primary"
            label="Load ~/.ssh/id_rsa"
            @click="load_default_private_ley"
            :disabled="disableDefaultSSHLoad"
          />
        </div>
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
import { platform } from "os";
const crypto = require("crypto");
const { dialog } = require("electron").remote;
const fs = require("fs");

export default {
  data() {
    return {
      encrypted_text: "",
      private_key_text: "",
      decrypted_text: "None"
    };
  },
  computed: {
    disableDefaultSSHLoad() {
      if (process.platform == "win32") {
        return true;
      }

      if (process.platform == "aix") {
        return true;
      }

      return false;
    }
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
    },
    load_private_key_from_file() {
      const f = dialog.showOpenDialogSync({
        properties: ["openFile", "showHiddenFiles", "dontAddToRecent"]
      });
      if (f) {
        this.private_key_text = fs.readFileSync(f[0], "utf8");
      }
    },
    load_message_from_file() {
      const f = dialog.showOpenDialogSync({
        properties: ["openFile", "showHiddenFiles", "dontAddToRecent"]
      });
      if (f) {
        this.encrypted_text = fs.readFileSync(f[0], "utf8");
      }
    },
    load_default_private_ley() {
      const homedir = require("os").homedir();
      const path = require("path");
      const f = path.join(homedir, ".ssh", "id_rsa");
      this.private_key_text = fs.readFileSync(f[0], "utf8");
    }
  }
};
</script>
