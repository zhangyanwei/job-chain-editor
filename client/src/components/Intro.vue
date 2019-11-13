<template>
  <v-container>
    <div>
      <h1>说明</h1>
      <p>
        由于 Jenkins 任务的配置越来越复杂，而且需要应对多种环境，修改和维护就变得不再那么容易了。<br/>
        该 Web 工具的目的是帮助对我们以更加容易的方式对 Jenkins 任务进行配置。
      </p>
      <p>
        术语说明：
        <ul>
          <li><b>保存</b>: 仅仅将修改提交到服务器中，不会提交到服务器本地的 Git 仓库。</li>
          <li><b>提交</b>: 将修改从服务器推送到远程 Git 仓库。</li>
        </ul>
      </p>
    </div>
  </v-container>
</template>

<script>
export default {
    namme: 'intro'
}
</script>

