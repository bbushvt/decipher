<template>
  <q-layout view="hHh lpR fFf">
    <q-drawer show-if-above v-model="left" side="left" bordered>
      <template v-if="cloud_integration_enabled">
        <template v-if="cloud_servers_loaded">
          <div class="full-width row justify-center">Server List</div>
          <div class="full-width row">
            <div class="col-9 q-pa-md">
              <q-btn round color="primary" icon="mdi-refresh" @click="load_servers_from_cloud" />
            </div>
            <div class="col q-pa-md">
              <q-btn round color="primary" icon="mdi-api" @click="enable_cloud_integration" />
            </div>
          </div>

          <q-list bordered>
            <q-item
              class="row justify-center items-center"
              v-ripple
              v-for="server in windows_server_list"
              :key="server.id"
              :active="server_selected === server.id"
              @click="encrypted_text = server.encrypted_password; server_selected = server.id"
              clickable
              active-class="my-menu-link"
            >
              <q-item-label>{{server.name}}</q-item-label>
            </q-item>
          </q-list>
        </template>
        <template v-else>
          <span class="absolute-center">
            <q-spinner color="primary" size="3em" :thickness="10" />
          </span>
        </template>
      </template>
      <template v-else>
        <span class="absolute-center">
          <q-btn
            no-caps
            size="sm"
            color="primary"
            label="Enable Cloud Integration"
            @click="enable_cloud_integration"
          />
          <br />
          <br />
          <br />
          <div
            class="brand-color text-center row inline flex-center text-white rounded-borders bg-negative"
          >{{api_key_error_message}}</div>
        </span>
      </template>
    </q-drawer>

    <q-dialog
      v-model="api_key_dialog"
      persistent
      transition-show="flip-down"
      transition-hide="flip-up"
    >
      <q-card>
        <q-bar>
          <q-space />

          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip content-class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section>
          <div class="text-h6">Enter IBM Cloud API Key</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input bg-color="white" outlined v-model="api_key" label="API Key" />
        </q-card-section>

        <q-card-actions align="right">
          <q-toggle
            class="q-pr-md"
            v-model="save_api_key"
            checked-icon="check"
            color="green"
            unchecked-icon="clear"
            label="Save API Key"
          />
          <q-btn
            size="sm"
            color="primary"
            label="OK"
            v-close-popup
            @click="load_servers_from_cloud"
          />
          <q-btn size="sm" color="red" label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-page-container class="q-pa-md">
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

      <div class="row q-pa-md q-gutter-xl">
        <div
          class="col-4 offset-md-3 brand-color row flex-center text-white rounded-borders"
          v-if="decrypted_text == ''"
        ></div>

        <div
          class="col-4 offset-md-3 brand-color row flex-center text-white rounded-borders bg-primary"
          v-if="!decrypt_error && decrypted_text != ''"
        >
          {{decrypted_text}}
          <div class="float-right">
            <q-btn
              icon="mdi-content-copy"
              round
              flat
              no-outline
              color="white"
              @click="copy_password"
            />
          </div>
        </div>
        <div
          class="col-4 offset-md-3 brand-color row flex-center text-white rounded-borders bg-negative"
          v-if="decrypt_error && decrypted_text != ''"
        >{{decrypted_text}}</div>

        <div class="col offset-md-2">
          <q-btn color="primary" label="Decrypt" @click="decrypt_message" />
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import { platform } from "os";
const crypto = require("crypto");
const { dialog } = require("electron").remote;
const fs = require("fs");
const { ipcRenderer } = require("electron");
const { clipboard } = require("electron");

export default {
  data() {
    return {
      encrypted_text: "",
      private_key_text: "",
      decrypted_text: "",
      left: false,
      cloud_integration_enabled: false,
      cloud_servers_loaded: false,
      windows_server_list: [],
      api_key_dialog: false,
      api_key: "",
      server_selected: "",
      api_key_error_message: "",
      decrypt_error: false,
      save_api_key: false
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
  mounted() {
    this.$nextTick(() => {
      ipcRenderer.on("receive_cloud_server_list", (e, args) => {
        if (args) {
          this.windows_server_list = args;
          this.cloud_servers_loaded = true;
        } else {
          this.cloud_integration_enabled = false;
          this.api_key_error_message =
            "Invalid API Key or Unable to connect to API";
        }
      });
      try {
        console.log("Checking on the config file");
        if (fs.existsSync("config.json")) {
          let rawData = fs.readFileSync("config.json");
          let configData = JSON.parse(rawData);
          this.api_key = configData["api_key"] || "";
          if (this.api_key != "") {
            this.load_servers_from_cloud();
          }
        }
      } catch (e) {
        console.log(e);
        return;
      }
    });
  },
  methods: {
    decrypt_message() {
      if (this.encrypted_text == "") {
        this.decrypt_error = true;
        this.decrypted_text = "Please enter an encrypted message";
        return;
      }

      if (this.private_key_text == "") {
        this.decrypt_error = true;
        this.decrypted_text = "Please enter your private key";
        return;
      }

      const buf = Buffer.from(this.encrypted_text, "base64");

      try {
        var password = crypto.privateDecrypt(
          {
            key: this.private_key_text.toString(),
            passphrase: "",
            padding: crypto.constants.RSA_PKCS1_PADDING
          },
          buf
        );
        this.decrypted_text = password.toString("utf8");
        this.decrypt_error = false;
      } catch (e) {
        this.decrypt_error = true;
        this.decrypted_text =
          "Error: Either Encrypted Message or Private Key invalid.";
      }
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
    },
    enable_cloud_integration() {
      this.api_key_dialog = true;
      //this.cloud_integration = true;
    },
    async load_servers_from_cloud() {
      // Tell the UI are have enabled cloud integration
      this.cloud_integration_enabled = true;
      this.cloud_servers_loaded = false;
      this.server_selected = "";

      // check to see if we are saving the API key
      if (this.save_api_key) {
        this.write_config_file();
      }

      // Send the API key to the main process
      ipcRenderer.send("get_cloud_server_list", this.api_key);
    },
    copy_password() {
      clipboard.writeText(this.decrypted_text, "selection");
    },
    write_config_file() {
      let config_file = {
        api_key: this.api_key
      };

      let data = JSON.stringify(config_file);
      fs.writeFileSync("config.json", data);
    }
  }
};
</script>

<style lang="sass">
.my-menu-link
  color: white
  background: blue
</style>
