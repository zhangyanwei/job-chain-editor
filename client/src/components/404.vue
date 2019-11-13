<template>
  <v-container>
    <v-layout>
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-card-title primary-title>
            <div>
              <h3 class="headline mb-0">It's Mars!</h3>
              <div>该路径下的配置项不存在！</div>
            </div>
          </v-card-title>
          <v-card-actions>
            <v-btn to="/">返回</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
    namme: 'intro'
}
</script>

